import { useCallback, useState } from "react";

import { CloudArrowUpIcon } from "@heroicons/react/24/outline";

import { Tab, TabGroup } from "@/docs/mdx/components/tabs/Tabs";
import { cn } from "@/utils/utils";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface ImageDropZoneProps {
  onImageSelect?: (file: File) => void;
  onImageUrl?: (url: string) => void;
}

export default function ImageDropZone({
  onImageSelect,
  onImageUrl,
}: ImageDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (imageFile && onImageSelect) {
        onImageSelect(imageFile);
      }
    },
    [onImageSelect]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/") && onImageSelect) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const handleUrlSubmit = useCallback(() => {
    if (imageUrl.trim() && onImageUrl) {
      onImageUrl(imageUrl.trim());
    }
  }, [imageUrl, onImageUrl]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "relative flex w-full max-w-none cursor-pointer justify-center rounded-lg border-2 border-dashed border-gray-500 text-center transition-colors",
            {
              "border-blue-500 bg-blue-50": isDragOver,
              "hover:bg-gray-50": !isDragOver,
            }
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-muted-foreground flex items-center gap-2">
            <CloudArrowUpIcon className="size-8" />
            <p>Add an image</p>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px]">
        <TabGroup>
          <Tab title="Upload">
            <Button asChild className="-mt-6">
              <button className="relative w-full">
                Upload file
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </button>
            </Button>
          </Tab>
          <Tab title="URL">
            <div className="-mt-3 flex flex-col gap-2">
              <Input
                type="url"
                placeholder="Paste in https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full"
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={!imageUrl.trim()}
                className="w-full"
              >
                Embed image
              </Button>
            </div>
          </Tab>
        </TabGroup>
      </PopoverContent>
    </Popover>
  );
}
