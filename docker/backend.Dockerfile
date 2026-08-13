FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libicu-dev libonig-dev \
    && docker-php-ext-install pdo_mysql zip intl bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY composer.json ./
RUN composer install --no-interaction --no-scripts --prefer-dist || true

COPY . .

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
