Add-Type -AssemblyName System.Drawing
$assetRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../assets'))
foreach ($target in @(@('icon.png', 1024, $false), @('adaptive-icon.png', 1024, $true), @('favicon.png', 64, $false))) {
  $size = [int]$target[1]
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  if ($target[2]) { $graphics.Clear([System.Drawing.Color]::Transparent) } else { $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#EF6438')) }
  $font = [System.Drawing.Font]::new('Arial', [single]($size * .60), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = [System.Drawing.RectangleF]::new(0, [single](-$size * .06), $size, $size)
  $graphics.DrawString('b', $font, [System.Drawing.Brushes]::White, $rect, $format)
  $bitmap.Save((Join-Path $assetRoot $target[0]), [System.Drawing.Imaging.ImageFormat]::Png)
  $font.Dispose(); $format.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
