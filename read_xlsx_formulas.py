import openpyxl

wb = openpyxl.load_workbook('margin_calc.xlsx', data_only=False)
sheet = wb.active

# Let's read formulas for row 5 (the first data row)
print("Formulas in Row 5:")
for col in ['F', 'G', 'H', 'I', 'K']:
    cell = sheet[f"{col}5"]
    print(f"{col}: {cell.value}")

print("\nSummary/Other fields:")
print(f"J2: {sheet['J2'].value}")
print(f"K2: {sheet['K2'].value}")
print(f"L2: {sheet['L2'].value}")
print(f"J3: {sheet['J3'].value}")
print(f"K3: {sheet['K3'].value}")
print(f"J23: {sheet['J23'].value}")
print(f"K23: {sheet['K23'].value}")
