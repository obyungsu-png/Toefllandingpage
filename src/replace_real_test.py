#!/usr/bin/env python3

# Read the App.tsx file
with open('/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Perform all replacements
content = content.replace("setActiveTab('Real Test')", "setActiveTab('Test')")
content = content.replace('activeTab === "Real Test"', 'activeTab === "Test"')
content = content.replace("activeTab === 'Real Test'", "activeTab === 'Test'")
content = content.replace("testType === 'Real Test'", "testType === 'Test'")
content = content.replace('testType === "Real Test"', 'testType === "Test"')
content = content.replace("RealTestCard", "TestCard")
content = content.replace("Real Test", "Test")

# Write the updated content back
with open('/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacements completed successfully!")
