import { MaterialIcon, getFileIcon, getFolderIcon } from "react-material-icon-theme";
import { cn } from "@/lib/utils";

interface FileIconProps {
  fileName: string;
  size?: number;
  className?: string;
}

export function FileIcon({ fileName, size = 16, className }: FileIconProps) {
  const lowerName = fileName.toLowerCase();
  const ext = lowerName.includes(".") ? lowerName.split(".").pop() || "" : "";

  // Specific overrides for Flutter / Dart developer experience
  let iconName: string;
  if (lowerName === "pubspec.yaml" || lowerName === "pubspec.lock") {
    iconName = "dart";
  } else {
    iconName = getFileIcon({
      fileName: lowerName,
      fileExtension: ext,
      fallback: "file",
    });
  }

  return (
    <MaterialIcon
      name={iconName}
      size={size}
      className={cn("shrink-0 flex items-center justify-center [&>svg]:size-full", className)}
      alt={fileName}
    />
  );
}

interface FolderIconProps {
  folderName: string;
  isOpen?: boolean;
  size?: number;
  className?: string;
}

export function FolderMaterialIcon({
  folderName,
  isOpen = false,
  size = 16,
  className,
}: FolderIconProps) {
  const lowerName = folderName.toLowerCase();
  const iconName = getFolderIcon({
    folderName: lowerName,
    isOpen,
    fallback: isOpen ? "folder-open" : "folder",
  });

  return (
    <MaterialIcon
      name={iconName}
      size={size}
      className={cn("shrink-0 flex items-center justify-center [&>svg]:size-full", className)}
      alt={folderName}
    />
  );
}
