import Image from "next/image";

import { UserIcon } from "@heroicons/react/24/outline";

import { cn } from "@/utils/utils";

export function ProfileImage({
  picture,
  name,
  className,
  size = 32,
}: {
  picture?: string;
  name?: string;
  className?: string;
  size?: number;
}) {
  return (
    <>
      {picture != null ? (
        <Image
          src={picture}
          alt={name ?? "user photo"}
          className={cn("rounded-full", className)}
          width={size}
          height={size}
        />
      ) : (
        <div
          className={cn(
            "bg-gray-1200 border-border size-8 rounded-full border p-1",
            className
          )}
        >
          <UserIcon className="size-full text-white" />
        </div>
      )}
    </>
  );
}
