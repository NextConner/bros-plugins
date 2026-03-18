$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Canvas {
  param(
    [int]$Width,
    [int]$Height
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  return @{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-Brush {
  param(
    [string]$Color
  )

  return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($Color))
}

function New-Pen {
  param(
    [string]$Color,
    [float]$Width = 1
  )

  return New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($Color), $Width)
}

function Draw-BrandBackground {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Width,
    [int]$Height
  )

  $rect = New-Object System.Drawing.Rectangle 0, 0, $Width, $Height
  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.ColorTranslator]::FromHtml("#edf6fb"),
    [System.Drawing.ColorTranslator]::FromHtml("#d6e8f8"),
    45
  )
  $Graphics.FillRectangle($gradient, $rect)

  $accentBrush = New-Brush "#cfe3f5"
  $Graphics.FillEllipse($accentBrush, -120, -80, 360, 260)
  $Graphics.FillEllipse($accentBrush, $Width - 280, $Height - 220, 320, 240)
}

function Draw-TopBar {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Width,
    [string]$Title
  )

  $barBrush = New-Brush "#0f4c81"
  $Graphics.FillRectangle($barBrush, 0, 0, $Width, 64)

  $dotBrush = New-Brush "#f2f7fb"
  $Graphics.FillEllipse($dotBrush, 24, 22, 10, 10)
  $Graphics.FillEllipse($dotBrush, 42, 22, 10, 10)
  $Graphics.FillEllipse($dotBrush, 60, 22, 10, 10)

  $font = New-Object System.Drawing.Font("Segoe UI Semibold", 18, [System.Drawing.FontStyle]::Regular)
  $textBrush = New-Brush "#ffffff"
  $Graphics.DrawString($Title, $font, $textBrush, 100, 18)
}

function Draw-Icon {
  param(
    [int]$Size,
    [string]$OutputPath
  )

  $canvas = New-Canvas -Width $Size -Height $Size
  $bitmap = $canvas.Bitmap
  $graphics = $canvas.Graphics

  $graphics.Clear([System.Drawing.Color]::Transparent)
  $backgroundPath = New-RoundedRectanglePath -X 0 -Y 0 -Width $Size -Height $Size -Radius ($Size * 0.22)
  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle 0, 0, $Size, $Size),
    [System.Drawing.ColorTranslator]::FromHtml("#0f4c81"),
    [System.Drawing.ColorTranslator]::FromHtml("#2e7db8"),
    45
  )
  $graphics.FillPath($backgroundBrush, $backgroundPath)

  $selectionPen = New-Pen "#ffffff" ([Math]::Max(2, $Size * 0.06))
  $selectionPen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Center
  $selectionRect = New-Object System.Drawing.RectangleF ($Size * 0.2), ($Size * 0.18), ($Size * 0.58), ($Size * 0.3)
  $graphics.DrawRectangle($selectionPen, $selectionRect.X, $selectionRect.Y, $selectionRect.Width, $selectionRect.Height)

  $textBrush = New-Brush "#ffffff"
  $mainFont = New-Object System.Drawing.Font("Segoe UI Bold", [Math]::Max(8, $Size * 0.26), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $smallFont = New-Object System.Drawing.Font("Segoe UI Semibold", [Math]::Max(6, $Size * 0.14), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $graphics.DrawString("T", $mainFont, $textBrush, (New-Object System.Drawing.RectangleF 0, ($Size * 0.38), $Size, ($Size * 0.34)), $format)
  $graphics.DrawString("EN-ZH", $smallFont, $textBrush, (New-Object System.Drawing.RectangleF 0, ($Size * 0.7), $Size, ($Size * 0.12)), $format)

  Save-Png -Bitmap $bitmap -Path $OutputPath
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Draw-InPageScreenshot {
  param(
    [string]$OutputPath
  )

  $width = 1400
  $height = 900
  $canvas = New-Canvas -Width $width -Height $height
  $bitmap = $canvas.Bitmap
  $graphics = $canvas.Graphics

  Draw-BrandBackground -Graphics $graphics -Width $width -Height $height
  Draw-TopBar -Graphics $graphics -Width $width -Title "Bros Selection Translator"

  $pageCardPath = New-RoundedRectanglePath -X 84 -Y 126 -Width 1232 -Height 690 -Radius 28
  $pageCardBrush = New-Brush "#ffffff"
  $pageCardPen = New-Pen "#d4e2ef" 2
  $graphics.FillPath($pageCardBrush, $pageCardPath)
  $graphics.DrawPath($pageCardPen, $pageCardPath)

  $headingFont = New-Object System.Drawing.Font("Georgia", 28, [System.Drawing.FontStyle]::Regular)
  $bodyFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
  $mutedBrush = New-Brush "#4f6478"
  $graphics.DrawString("Reading with one-click selected-text translation", $headingFont, (New-Brush "#1f2f3c"), 128, 180)

  $paragraphs = @(
    "The plugin listens for an English word or phrase selection and opens a light in-page card near the selection.",
    "Single words show phonetics first, then multiple Chinese senses or English dictionary definitions depending on the selected mode.",
    "Users can switch providers without leaving the page."
  )
  $y = 250
  foreach ($line in $paragraphs) {
    $graphics.DrawString($line, $bodyFont, $mutedBrush, (New-Object System.Drawing.RectangleF 128, $y, 720, 60))
    $y += 52
  }

  $highlightBrush = New-Brush "#d9ecfb"
  $graphics.FillRectangle($highlightBrush, 320, 366, 176, 28)
  $graphics.DrawString("translation", $bodyFont, (New-Brush "#0f4c81"), 328, 368)

  $panelPath = New-RoundedRectanglePath -X 880 -Y 214 -Width 336 -Height 426 -Radius 18
  $panelPen = New-Pen "#d7e5f1" 2
  $panelBackground = New-Brush "#fbfdfd"
  $graphics.FillPath($panelBackground, $panelPath)
  $graphics.DrawPath($panelPen, $panelPath)

  $headerPath = New-RoundedRectanglePath -X 880 -Y 214 -Width 336 -Height 98 -Radius 18
  $headerBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle 880, 214, 336, 98),
    [System.Drawing.ColorTranslator]::FromHtml("#0f4c81"),
    [System.Drawing.ColorTranslator]::FromHtml("#3179b5"),
    0
  )
  $graphics.FillPath($headerBrush, $headerPath)
  $headerTextBrush = New-Brush "#ffffff"
  $headerTitleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 16, [System.Drawing.FontStyle]::Regular)
  $headerBodyFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("Selection Translator", $headerTitleFont, $headerTextBrush, 902, 236)
  $graphics.DrawString("/tran?s'lei??n/", $headerBodyFont, $headerTextBrush, 902, 268)
  $graphics.DrawString("translation", $headerBodyFont, $headerTextBrush, 902, 290)

  $chipBrush = New-Brush "#edf5fb"
  $chipPen = New-Pen "#d9e5f0" 1
  foreach ($x in @(902, 1012, 1122)) {
    $chip = New-RoundedRectanglePath -X $x -Y 332 -Width 96 -Height 34 -Radius 10
    $graphics.FillPath($chipBrush, $chip)
    $graphics.DrawPath($chipPen, $chip)
  }
  $chipFont = New-Object System.Drawing.Font("Segoe UI Semibold", 11, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("English-ZH", $chipFont, (New-Brush "#20303e"), 918, 343)
  $graphics.DrawString("Google Web", $chipFont, (New-Brush "#20303e"), 1028, 343)
  $graphics.DrawString("Refresh", $chipFont, (New-Brush "#20303e"), 1149, 343)

  $sectionFont = New-Object System.Drawing.Font("Segoe UI Semibold", 12, [System.Drawing.FontStyle]::Regular)
  $mainFont = New-Object System.Drawing.Font("Segoe UI Semibold", 24, [System.Drawing.FontStyle]::Regular)
  $smallFont = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("Bilingual Dictionary", $sectionFont, (New-Brush "#6a7d8f"), 904, 388)
  $graphics.DrawString("n.  translation; rendition", $mainFont, (New-Brush "#152331"), (New-Object System.Drawing.RectangleF 904, 416, 280, 68))

  $entries = @(
    @("1. translate from one language into another", "verb"),
    @("2. the result of translating text or speech", "noun"),
    @("3. explanation rendered in Chinese", "noun")
  )
  $entryY = 508
  foreach ($entry in $entries) {
    $graphics.DrawLine((New-Pen "#e6edf4" 1), 904, $entryY - 10, 1188, $entryY - 10)
    $graphics.DrawString($entry[0], $smallFont, (New-Brush "#20303e"), (New-Object System.Drawing.RectangleF 904, $entryY, 280, 24))
    $graphics.DrawString($entry[1], $smallFont, (New-Brush "#728394"), 904, ($entryY + 24))
    $entryY += 70
  }

  $tagFont = New-Object System.Drawing.Font("Segoe UI Semibold", 26, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("Screenshot 1", $tagFont, (New-Brush "#0f4c81"), 84, 830)
  $graphics.DrawString("In-page translation card", $bodyFont, $mutedBrush, 270, 836)

  Save-Png -Bitmap $bitmap -Path $OutputPath
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Draw-PopupScreenshot {
  param(
    [string]$OutputPath
  )

  $width = 1400
  $height = 900
  $canvas = New-Canvas -Width $width -Height $height
  $bitmap = $canvas.Bitmap
  $graphics = $canvas.Graphics

  Draw-BrandBackground -Graphics $graphics -Width $width -Height $height
  Draw-TopBar -Graphics $graphics -Width $width -Title "Bros Selection Translator"

  $titleFont = New-Object System.Drawing.Font("Georgia", 30, [System.Drawing.FontStyle]::Regular)
  $bodyFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("Quick popup settings", $titleFont, (New-Brush "#1f2f3c"), 96, 168)
  $graphics.DrawString("Users can switch default mode and providers directly from the toolbar popup.", $bodyFont, (New-Brush "#4f6478"), 96, 224)

  $popupPath = New-RoundedRectanglePath -X 878 -Y 164 -Width 340 -Height 520 -Radius 24
  $popupBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle 878, 164, 340, 520),
    [System.Drawing.ColorTranslator]::FromHtml("#f8fbfd"),
    [System.Drawing.ColorTranslator]::FromHtml("#eef5fa"),
    90
  )
  $popupPen = New-Pen "#d8e5f0" 2
  $graphics.FillPath($popupBrush, $popupPath)
  $graphics.DrawPath($popupPen, $popupPath)

  $h1Font = New-Object System.Drawing.Font("Segoe UI Semibold", 20, [System.Drawing.FontStyle]::Regular)
  $smallFont = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("Selection Translator", $h1Font, (New-Brush "#163046"), 908, 198)
  $graphics.DrawString("Translate selected English text with popup-level defaults.", $smallFont, (New-Brush "#5d7082"), (New-Object System.Drawing.RectangleF 908, 234, 260, 48))

  $labelFont = New-Object System.Drawing.Font("Segoe UI Semibold", 12, [System.Drawing.FontStyle]::Regular)
  $selectFont = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular)
  $sections = @(
    @("Default Mode", "English to Chinese", 312),
    @("ZH Provider", "Google Web", 392),
    @("EN Dictionary", "Free Dictionary API", 472)
  )
  foreach ($section in $sections) {
    $graphics.DrawString($section[0], $labelFont, (New-Brush "#163046"), 908, [int]$section[2])
    $box = New-RoundedRectanglePath -X 908 -Y ([int]$section[2] + 26) -Width 280 -Height 40 -Radius 12
    $graphics.FillPath((New-Brush "#ffffff"), $box)
    $graphics.DrawPath((New-Pen "#d7e5f0" 1), $box)
    $graphics.DrawString($section[1], $selectFont, (New-Brush "#163046"), 924, ([int]$section[2] + 39))
  }

  $button = New-RoundedRectanglePath -X 908 -Y 584 -Width 280 -Height 42 -Radius 12
  $graphics.FillPath((New-Brush "#0f4c81"), $button)
  $graphics.DrawString("Open Full Settings", $labelFont, (New-Brush "#ffffff"), 980, 597)

  $bullets = @(
    "Fast access to provider switching",
    "Matches page card behavior",
    "Uses synchronized browser storage"
  )
  $y = 334
  foreach ($bullet in $bullets) {
    $graphics.FillEllipse((New-Brush "#0f4c81"), 108, ($y + 6), 8, 8)
    $graphics.DrawString($bullet, $bodyFont, (New-Brush "#4f6478"), 126, $y)
    $y += 64
  }

  $tagFont = New-Object System.Drawing.Font("Segoe UI Semibold", 26, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("Screenshot 2", $tagFont, (New-Brush "#0f4c81"), 96, 812)
  $graphics.DrawString("Toolbar popup settings", $bodyFont, (New-Brush "#4f6478"), 280, 818)

  Save-Png -Bitmap $bitmap -Path $OutputPath
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Draw-OptionsScreenshot {
  param(
    [string]$OutputPath
  )

  $width = 1400
  $height = 900
  $canvas = New-Canvas -Width $width -Height $height
  $bitmap = $canvas.Bitmap
  $graphics = $canvas.Graphics

  Draw-BrandBackground -Graphics $graphics -Width $width -Height $height
  Draw-TopBar -Graphics $graphics -Width $width -Title "Bros Selection Translator"

  $pagePath = New-RoundedRectanglePath -X 98 -Y 118 -Width 1204 -Height 710 -Radius 34
  $pageBrush = New-Brush "#f7fbfe"
  $pagePen = New-Pen "#d7e5f0" 2
  $graphics.FillPath($pageBrush, $pagePath)
  $graphics.DrawPath($pagePen, $pagePath)

  $eyebrowFont = New-Object System.Drawing.Font("Segoe UI Semibold", 12, [System.Drawing.FontStyle]::Regular)
  $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 34, [System.Drawing.FontStyle]::Regular)
  $bodyFont = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("Bros Chromium Plugin", $eyebrowFont, (New-Brush "#0f4c81"), 150, 170)
  $graphics.DrawString("Selection Translator Settings", $titleFont, (New-Brush "#133048"), 150, 196)
  $graphics.DrawString("Configure the default translation mode, bilingual provider and English dictionary source.", $bodyFont, (New-Brush "#5f7385"), (New-Object System.Drawing.RectangleF 150, 254, 620, 52))

  $cardPath = New-RoundedRectanglePath -X 150 -Y 340 -Width 1096 -Height 408 -Radius 28
  $graphics.FillPath((New-Brush "#ffffff"), $cardPath)
  $graphics.DrawPath((New-Pen "#d7e5f0" 1), $cardPath)

  $labelFont = New-Object System.Drawing.Font("Segoe UI Semibold", 14, [System.Drawing.FontStyle]::Regular)
  $selectFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)
  $fields = @(
    @("Default Translation Mode", "English to Chinese", 386),
    @("English to Chinese Provider", "Google Web", 476),
    @("English Dictionary Source", "Free Dictionary API", 566)
  )
  foreach ($field in $fields) {
    $graphics.DrawString($field[0], $labelFont, (New-Brush "#133048"), 190, [int]$field[2])
    $box = New-RoundedRectanglePath -X 190 -Y ([int]$field[2] + 30) -Width 1012 -Height 44 -Radius 14
    $graphics.FillPath((New-Brush "#ffffff"), $box)
    $graphics.DrawPath((New-Pen "#d7e5f0" 1), $box)
    $graphics.DrawString($field[1], $selectFont, (New-Brush "#133048"), 208, ([int]$field[2] + 43))
  }

  $checkboxPen = New-Pen "#0f4c81" 2
  $graphics.DrawRectangle($checkboxPen, 190, 680, 18, 18)
  $graphics.DrawLine($checkboxPen, 194, 689, 198, 695)
  $graphics.DrawLine($checkboxPen, 198, 695, 205, 684)
  $graphics.DrawString("Auto translate after selection", $selectFont, (New-Brush "#133048"), 220, 678)

  $tagFont = New-Object System.Drawing.Font("Segoe UI Semibold", 26, [System.Drawing.FontStyle]::Regular)
  $graphics.DrawString("Screenshot 3", $tagFont, (New-Brush "#0f4c81"), 98, 846)
  $graphics.DrawString("Full settings page", $bodyFont, (New-Brush "#4f6478"), 280, 852)

  Save-Png -Bitmap $bitmap -Path $OutputPath
  $graphics.Dispose()
  $bitmap.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $root "assets\icons"
$storeDir = Join-Path $root "assets\store"

if (-not (Test-Path $iconsDir)) {
  New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

if (-not (Test-Path $storeDir)) {
  New-Item -ItemType Directory -Path $storeDir | Out-Null
}

Draw-Icon -Size 16 -OutputPath (Join-Path $iconsDir "icon-16.png")
Draw-Icon -Size 32 -OutputPath (Join-Path $iconsDir "icon-32.png")
Draw-Icon -Size 48 -OutputPath (Join-Path $iconsDir "icon-48.png")
Draw-Icon -Size 128 -OutputPath (Join-Path $iconsDir "icon-128.png")

Draw-InPageScreenshot -OutputPath (Join-Path $storeDir "screenshot-1-in-page-card.png")
Draw-PopupScreenshot -OutputPath (Join-Path $storeDir "screenshot-2-popup.png")
Draw-OptionsScreenshot -OutputPath (Join-Path $storeDir "screenshot-3-settings.png")

Write-Output "Store assets generated."
