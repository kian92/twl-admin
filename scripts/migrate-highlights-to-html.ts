/**
 * Migration Script: Convert Highlights, Inclusions, and Exclusions from Array to HTML
 *
 * This script converts existing newline-separated array data to HTML bullet point format.
 *
 * Usage:
 *   npx tsx scripts/migrate-highlights-to-html.ts
 *
 * What it does:
 * - Fetches all experiences from the database
 * - Converts highlights[], inclusions[], exclusions[] arrays to HTML bullet lists
 * - Updates each experience with the new HTML format
 * - Provides detailed logging of the migration process
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Convert string array to HTML bullet list
 */
function arrayToHtmlBulletList(items: string[] | null): string {
  if (!items || items.length === 0) {
    return ''
  }

  // Filter out empty strings
  const validItems = items.filter(item => item && item.trim())

  if (validItems.length === 0) {
    return ''
  }

  // Create HTML bullet list
  const listItems = validItems
    .map(item => `<li><p>${item.trim()}</p></li>`)
    .join('')

  return `<ul>${listItems}</ul>`
}

async function migrateExperiences() {
  console.log('🚀 Starting migration: Array to HTML Bullet Lists\n')

  // Fetch all experiences
  console.log('📥 Fetching all experiences from database...')
  const { data: experiences, error: fetchError } = await supabase
    .from('experiences')
    .select('id, title, highlights, inclusions, exclusions')

  if (fetchError) {
    console.error('❌ Error fetching experiences:', fetchError)
    process.exit(1)
  }

  if (!experiences || experiences.length === 0) {
    console.log('✅ No experiences found in database. Migration complete.')
    return
  }

  console.log(`✓ Found ${experiences.length} experiences\n`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  // Process each experience
  for (const experience of experiences) {
    console.log(`\n📝 Processing: ${experience.title} (${experience.id})`)

    // Check if data is already in HTML format (contains <ul> or <li> tags)
    const isHighlightsHtml = typeof experience.highlights === 'string' &&
      (experience.highlights.includes('<ul>') || experience.highlights.includes('<li>'))
    const isInclusionsHtml = typeof experience.inclusions === 'string' &&
      (experience.inclusions.includes('<ul>') || experience.inclusions.includes('<li>'))
    const isExclusionsHtml = typeof experience.exclusions === 'string' &&
      (experience.exclusions.includes('<ul>') || experience.exclusions.includes('<li>'))

    if (isHighlightsHtml && isInclusionsHtml && isExclusionsHtml) {
      console.log('   ⏭️  Already in HTML format, skipping...')
      skipCount++
      continue
    }

    // Convert arrays to HTML
    const highlightsHtml = Array.isArray(experience.highlights)
      ? arrayToHtmlBulletList(experience.highlights)
      : experience.highlights || ''

    const inclusionsHtml = Array.isArray(experience.inclusions)
      ? arrayToHtmlBulletList(experience.inclusions)
      : experience.inclusions || ''

    const exclusionsHtml = Array.isArray(experience.exclusions)
      ? arrayToHtmlBulletList(experience.exclusions)
      : experience.exclusions || ''

    console.log('   📊 Conversion preview:')
    if (Array.isArray(experience.highlights)) {
      console.log(`      Highlights: ${experience.highlights.length} items → HTML`)
    }
    if (Array.isArray(experience.inclusions)) {
      console.log(`      Inclusions: ${experience.inclusions.length} items → HTML`)
    }
    if (Array.isArray(experience.exclusions)) {
      console.log(`      Exclusions: ${experience.exclusions.length} items → HTML`)
    }

    // Update the experience
    const { error: updateError } = await supabase
      .from('experiences')
      .update({
        highlights: highlightsHtml,
        inclusions: inclusionsHtml,
        exclusions: exclusionsHtml,
        updated_at: new Date().toISOString()
      })
      .eq('id', experience.id)

    if (updateError) {
      console.error(`   ❌ Error updating experience: ${updateError.message}`)
      errorCount++
    } else {
      console.log('   ✅ Successfully migrated')
      successCount++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary:')
  console.log('='.repeat(60))
  console.log(`✅ Successfully migrated: ${successCount}`)
  console.log(`⏭️  Skipped (already HTML): ${skipCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📦 Total processed: ${experiences.length}`)
  console.log('='.repeat(60))

  if (errorCount > 0) {
    console.log('\n⚠️  Some experiences failed to migrate. Please check the errors above.')
    process.exit(1)
  } else {
    console.log('\n🎉 Migration completed successfully!')
  }
}

// Run the migration
migrateExperiences().catch(error => {
  console.error('\n💥 Unexpected error during migration:', error)
  process.exit(1)
})
