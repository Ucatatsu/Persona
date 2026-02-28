# Script to generate Android icons from logo.png

Add-Type -AssemblyName System.Drawing

$sourceLogo = "logo.png"
$androidResPath = "client\android\app\src\main\res"

# Check if source file exists
if (-not (Test-Path $sourceLogo)) {
    Write-Host "Error: file $sourceLogo not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Generating Android icons from $sourceLogo..." -ForegroundColor Cyan

# Sizes for different screen densities
$sizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# Load source image
$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path $sourceLogo))

foreach ($folder in $sizes.Keys) {
    $size = $sizes[$folder]
    $targetFolder = Join-Path $androidResPath $folder
    
    # Create folder if not exists
    if (-not (Test-Path $targetFolder)) {
        New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
    }
    
    # Create new image with required size
    $newImage = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($newImage)
    
    # Settings for high quality resize
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Draw image
    $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
    
    # Save icons
    $iconPath = Join-Path $targetFolder "ic_launcher.png"
    $iconRoundPath = Join-Path $targetFolder "ic_launcher_round.png"
    $iconForegroundPath = Join-Path $targetFolder "ic_launcher_foreground.png"
    
    $newImage.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $newImage.Save($iconRoundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $newImage.Save($iconForegroundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Created: $folder ($size x $size)" -ForegroundColor Green
    
    # Free resources
    $graphics.Dispose()
    $newImage.Dispose()
}

# Free source image
$sourceImage.Dispose()

Write-Host "`nIcons created successfully!" -ForegroundColor Green
Write-Host "Now you can rebuild the APK with new icons." -ForegroundColor Yellow

exit 0
