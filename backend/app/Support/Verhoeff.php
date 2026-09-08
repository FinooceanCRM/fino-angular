<?php

namespace App\Support;

/**
 * Verhoeff checksum used by UIDAI Aadhaar numbers. Direct port of the
 * reference Customer Survey's `validate_verhoeff()` (helpers/validation.php)
 * so the Vendor Certification's Aadhaar validation is byte-for-byte the
 * same, server and client.
 */
final class Verhoeff
{
    /** @var array<int, array<int, int>> */
    private const D = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    ];

    /** @var array<int, array<int, int>> */
    private const P = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ];

    /** @var array<int, int> */
    private const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

    public static function isValid(string $number): bool
    {
        if (preg_match('/^\d+$/', $number) !== 1) {
            return false;
        }

        $c = 0;
        $digits = array_reverse(array_map('intval', str_split($number)));
        foreach ($digits as $i => $digit) {
            $c = self::D[$c][self::P[$i % 8][$digit]];
        }

        return self::INV[$c] === 0;
    }
}
