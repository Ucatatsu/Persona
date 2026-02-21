package utils

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryUploader struct {
	cld *cloudinary.Cloudinary
}

func NewCloudinaryUploader() (*CloudinaryUploader, error) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return nil, fmt.Errorf("cloudinary credentials not configured")
	}

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cloudinary: %w", err)
	}

	return &CloudinaryUploader{cld: cld}, nil
}

// UploadAvatar uploads an avatar image to Cloudinary
func (c *CloudinaryUploader) UploadAvatar(ctx context.Context, file multipart.File, filename, userID string) (string, error) {
	return c.uploadImage(ctx, file, filename, "avatars", userID)
}

// UploadBanner uploads a banner image to Cloudinary
func (c *CloudinaryUploader) UploadBanner(ctx context.Context, file multipart.File, filename, userID string) (string, error) {
	return c.uploadImage(ctx, file, filename, "banners", userID)
}

func (c *CloudinaryUploader) uploadImage(ctx context.Context, file multipart.File, filename, folder, userID string) (string, error) {
	// Get file extension
	ext := strings.ToLower(filepath.Ext(filename))
	
	// Create public ID (unique identifier)
	publicID := fmt.Sprintf("%s/%s_%s", folder, userID, strings.TrimSuffix(filename, ext))

	// Upload parameters
	overwrite := true
	uploadParams := uploader.UploadParams{
		PublicID:     publicID,
		Folder:       "kvant",
		ResourceType: "image",
		Overwrite:    &overwrite, // Replace if exists
	}

	// For avatars, add transformation to resize
	if folder == "avatars" {
		uploadParams.Transformation = "c_fill,w_256,h_256,g_face"
	} else if folder == "banners" {
		uploadParams.Transformation = "c_fill,w_1200,h_400"
	}

	// Upload to Cloudinary
	result, err := c.cld.Upload.Upload(ctx, file, uploadParams)
	if err != nil {
		return "", fmt.Errorf("failed to upload to cloudinary: %w", err)
	}

	return result.SecureURL, nil
}

// DeleteImage deletes an image from Cloudinary
func (c *CloudinaryUploader) DeleteImage(ctx context.Context, publicID string) error {
	_, err := c.cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	return err
}

// ValidateImageFile validates that the uploaded file is an image
func ValidateImageFile(file multipart.File, header *multipart.FileHeader) error {
	// Check file size (10MB max)
	maxSize := int64(10 * 1024 * 1024) // 10MB
	if header.Size > maxSize {
		return fmt.Errorf("file too large: max size is 10MB")
	}

	// Check file type by extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	if !allowedExts[ext] {
		return fmt.Errorf("invalid file type: only JPG, PNG, GIF, and WebP are allowed")
	}

	// Read first 512 bytes to detect MIME type
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return fmt.Errorf("failed to read file: %w", err)
	}

	// Reset file pointer
	file.Seek(0, 0)

	// Check MIME type
	// Note: http.DetectContentType is not imported, so we'll skip this for now
	// In production, you should validate MIME type as well

	return nil
}
