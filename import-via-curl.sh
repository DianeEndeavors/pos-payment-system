#!/bin/bash

# Supabase credentials
SUPABASE_URL="https://fogxrcbhexdzfiztncch.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZ3hyY2JoZXhkemZpenRuY2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzE5NTksImV4cCI6MjA3ODcwNzk1OX0.on1CfmJRJyteHAIVDwWyHZU1J509QiiQiuFSDox6U3w"

echo "============================================"
echo "  Creating Product Categories via curl"
echo "============================================"
echo

# Create categories
echo "Creating Print category..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/product_categories" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Print", "icon": "FileText", "display_order": 10}' | head -1

echo "Creating Mail category..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/product_categories" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Mail", "icon": "Package", "display_order": 11}' | head -1

echo "Creating Foot Solutions category..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/product_categories" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Foot Solutions", "icon": "Package", "display_order": 12}' | head -1

echo "Creating Retail category..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/product_categories" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Retail", "icon": "Tag", "display_order": 13}' | head -1

echo "Creating Wholesale Print category..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/product_categories" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Wholesale Print", "icon": "Image", "display_order": 14}' | head -1

echo "Creating UV Printer category..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/product_categories" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "UV Printer", "icon": "Layers", "display_order": 15}' | head -1

echo "Creating Laser category..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/product_categories" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Laser", "icon": "Layers", "display_order": 16}' | head -1

echo "Creating Clothing category..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/product_categories" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Clothing", "icon": "Tag", "display_order": 17}' | head -1

echo
echo "============================================"
echo "  Categories created successfully!"
echo "============================================"
echo
echo "Now you can run: node import-products-api.js"
echo "Or check categories with:"
echo "  curl -s '${SUPABASE_URL}/rest/v1/product_categories?select=*' -H 'apikey: ${SUPABASE_KEY}'"
