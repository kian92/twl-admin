"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Eye,
  EyeOff,
  Download,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Media {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_type: "image" | "video";
  mime_type: string;
  file_size: number;
  cdn_url: string;
  bunny_video_id: string | null;
  thumbnail_url: string | null;
  tags: string[];
  is_public: boolean;
  created_at: string;
}

export default function MediaManagementPage() {
  const router = useRouter();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadIsPublic, setUploadIsPublic] = useState(true);

  useEffect(() => {
    loadMedia();
  }, [filterType]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") {
        params.append("fileType", filterType);
      }

      const res = await fetch(`/api/media?${params.toString()}`);
      const data = await res.json();

      if (res.status === 403) {
        // Unauthorized - redirect to dashboard
        setUnauthorized(true);
        toast.error("Access denied. Only admin and manager roles can access media.");
        router.push("/admin");
        return;
      }

      if (res.ok) {
        setMedia(data.media || []);
      } else {
        toast.error("Failed to load media");
      }
    } catch (error) {
      console.error("Failed to load media:", error);
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadFile) {
      toast.error("Please select a file");
      return;
    }

    if (!uploadTitle) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);
      formData.append("description", uploadDescription);
      formData.append("tags", uploadTags);
      formData.append("isPublic", String(uploadIsPublic));

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Upload successful");
        setShowUploadDialog(false);
        resetUploadForm();
        loadMedia();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadDescription("");
    setUploadTags("");
    setUploadIsPublic(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
      const res = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Media deleted successfully");
        loadMedia();
      } else {
        toast.error("Failed to delete media");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete media");
    }
  };

  const togglePublic = async (id: string, currentValue: boolean) => {
    try {
      const res = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isPublic: !currentValue }),
      });

      if (res.ok) {
        toast.success(`Media is now ${!currentValue ? "public" : "private"}`);
        loadMedia();
      } else {
        toast.error("Failed to update media");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update media");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredMedia = media.filter((item) => {
    if (filterType === "all") return true;
    return item.file_type === filterType;
  });

  // Show message if unauthorized
  if (unauthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">🔒</div>
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              Only admin and manager roles can access the media library.
            </p>
            <Button onClick={() => router.push("/admin")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">
            Upload and manage images and videos ({filteredMedia.length} items)
          </p>
        </div>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Media</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Supported: JPG, PNG, GIF, WebP, MP4, WebM, MOV (max 500MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter media title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="adventure, bali, sunset (comma-separated)"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Show on Consumer Site</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this media visible to customers
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={uploadIsPublic}
                  onCheckedChange={setUploadIsPublic}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Media</SelectItem>
            <SelectItem value="image">Images Only</SelectItem>
            <SelectItem value="video">Videos Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No media found. Upload your first file!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {/* Media Preview */}
              <div className="relative aspect-video bg-muted">
                {item.file_type === "image" ? (
                  <img
                    src={item.cdn_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                )}

                {/* Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant={item.file_type === "image" ? "default" : "secondary"}>
                    {item.file_type === "image" ? (
                      <ImageIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <Video className="w-3 h-3 mr-1" />
                    )}
                    {item.file_type.toUpperCase()}
                  </Badge>
                </div>

                {/* Public Badge */}
                <div className="absolute top-2 right-2">
                  <Badge variant={item.is_public ? "default" : "secondary"}>
                    {item.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Badge>
                </div>
              </div>

              {/* Media Info */}
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold truncate">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {item.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatFileSize(item.file_size)}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePublic(item.id, item.is_public)}
                  >
                    {item.is_public ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(item.cdn_url, "_blank")}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
