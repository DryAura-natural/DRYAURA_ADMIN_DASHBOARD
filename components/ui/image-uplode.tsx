"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash, ImagePlus } from "lucide-react";
import Image from "next/image";
import { Client, Storage, ID } from "appwrite";

const client = new Client();
client.setEndpoint("https://cloud.appwrite.io/v1").setProject("67a96cd2001e32766970");

const storage = new Storage(client);

interface ImageUploadProps {
  value: string[];
  disabled?: boolean;
  onChange: (url: string) => void;
  onRemove: (url: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, disabled, onChange, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("Updated Images:", value);
  }, [value]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    onChange(localUrl); // Add preview before uploading

    setUploading(true);
    try {
      const response = await storage.createFile("67a96d700017b622e519", ID.unique(), file);
      const uploadedUrl = `https://cloud.appwrite.io/v1/storage/buckets/67a96d700017b622e519/files/${response.$id}/view?project=67a96cd2001e32766970`;

      onChange(uploadedUrl); // Update with uploaded URL
    } catch (error) {
      console.error("Upload failed:", error);
      onRemove(localUrl); // Remove the preview if upload fails
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-3">Upload Images</h2>
      <div className="mb-4 flex flex-wrap gap-4">
        {value.map((url, index) => (
          <div key={`${url}-${index}`} className="relative w-[250px] h-[150px] rounded-md overflow-hidden border">
            <div className="z-10 absolute top-2 right-2">
              <Button type="button" onClick={() => onRemove(url)} variant="destructive" size="icon">
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <Image src={url} alt="Uploaded Image" width={250} height={150} className="object-cover w-full h-full" />
          </div>
        ))}
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleUpload} disabled={uploading || disabled} />
      <Button type="button" disabled={uploading || disabled} variant="secondary" onClick={triggerFileUpload}>
        <ImagePlus className="h-4 w-4 mr-2" />
        {uploading ? "Uploading..." : "Upload an Image"}
      </Button>
    </div>
  );
};

export default ImageUpload;
