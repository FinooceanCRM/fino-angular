<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('finoocean:info', function (): void {
    $this->info(config('app.name').' API — Phase 1 scaffold.');
})->purpose('Display application information');
