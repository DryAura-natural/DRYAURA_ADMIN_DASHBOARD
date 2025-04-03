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
  folderId?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, disabled, onChange, onRemove,folderId="67a9cbfa001285dc191f" }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // console.log("Updated Images:", value);
  }, [value]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    onChange(localUrl); // Add preview before uploading

    setUploading(true);
    try {
      // Log file details for debugging
      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        folderId: folderId
      });

      const response = await storage.createFile(folderId, ID.unique(), file);
      const uploadedUrl = `https://cloud.appwrite.io/v1/storage/buckets/${folderId}/files/${response.$id}/view?project=67a96cd2001e32766970`;

      console.log('File upload successful:', uploadedUrl);
      onChange(uploadedUrl); // Update with uploaded URL
    } catch (error) {
      console.error('File upload error:', error);
      
      // More detailed error handling
      if (error instanceof Error) {
        let errorMessage = 'Upload failed';
        
        // Check for specific CORS or network-related errors
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS configuration error. Please contact support.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        }

        // Optional: Show error to user or trigger error state
        alert(errorMessage);
      }

      // Revert to local URL or clear upload
      setUploading(false);
    } finally {
      // Ensure uploading state is reset
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