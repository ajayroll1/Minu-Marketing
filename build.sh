#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed default admin, demo users, categories, products and inventory
python manage.py seed_data

# Collect static files for WhiteNoise
python manage.py collectstatic --no-input
