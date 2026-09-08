<?php

namespace App\Support;

/**
 * Rough image-quality metrics (mean brightness + Laplacian variance) used to
 * reject blurred, very dark or blown-out photographs. Direct port of the
 * reference Customer Survey's `image_quality_metrics()` /
 * `validate_image_upload()` quality gate (helpers/upload.php).
 *
 * Returns null when GD is unavailable, in which case the client-side check
 * (mirrored in the Angular upload component) remains the only quality gate —
 * exactly the graceful degradation the source app relied on.
 */
final class ImageQuality
{
    /** Mirrors helpers/upload.php: dark < 32, bright > 232, blur variance < 12. */
    public const DARK_BELOW = 32.0;

    public const BRIGHT_ABOVE = 232.0;

    public const BLUR_BELOW = 12.0;

    /**
     * @return array{brightness: float, sharpness: float}|null
     */
    public static function metrics(string $file): ?array
    {
        if (! function_exists('imagecreatefromstring') || ! function_exists('imagescale')) {
            return null;
        }

        $raw = @file_get_contents($file);
        if ($raw === false) {
            return null;
        }

        $image = @imagecreatefromstring($raw);
        if ($image === false) {
            return null;
        }

        $small = @imagescale($image, 160);
        imagedestroy($image);
        if ($small === false) {
            return null;
        }

        $w = imagesx($small);
        $h = imagesy($small);
        $grey = [];
        $sum = 0.0;

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($small, $x, $y);
                $v = 0.299 * (($rgb >> 16) & 0xFF) + 0.587 * (($rgb >> 8) & 0xFF) + 0.114 * ($rgb & 0xFF);
                $grey[$y][$x] = $v;
                $sum += $v;
            }
        }
        imagedestroy($small);

        $count = $w * $h;
        if ($count === 0) {
            return null;
        }

        $responses = [];
        for ($y = 1; $y < $h - 1; $y++) {
            for ($x = 1; $x < $w - 1; $x++) {
                $responses[] = 4 * $grey[$y][$x]
                    - $grey[$y - 1][$x] - $grey[$y + 1][$x]
                    - $grey[$y][$x - 1] - $grey[$y][$x + 1];
            }
        }
        $n = count($responses);
        if ($n === 0) {
            return null;
        }
        $mean = array_sum($responses) / $n;
        $var = 0.0;
        foreach ($responses as $r) {
            $var += ($r - $mean) ** 2;
        }

        return [
            'brightness' => $sum / $count,
            'sharpness' => $var / $n,
        ];
    }

    /**
     * Human-readable rejection reason, or null when the image passes.
     */
    public static function rejectionReason(string $file, string $label): ?string
    {
        $metrics = self::metrics($file);
        if ($metrics === null) {
            return null;
        }

        if ($metrics['brightness'] < self::DARK_BELOW) {
            return $label.' is too dark. Please retake it in better light.';
        }
        if ($metrics['brightness'] > self::BRIGHT_ABOVE) {
            return $label.' is too bright / washed out. Please retake it.';
        }
        if ($metrics['sharpness'] < self::BLUR_BELOW) {
            return $label.' looks blurry. Please hold the camera steady and try again.';
        }

        return null;
    }
}
