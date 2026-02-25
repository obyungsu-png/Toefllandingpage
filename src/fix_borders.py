#!/usr/bin/env python3
# Script to replace border-2 border-black with border border-black

with open('/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences
content = content.replace('border-2 border-black', 'border border-black')

with open('/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all border-2 border-black occurrences in App.tsx")
