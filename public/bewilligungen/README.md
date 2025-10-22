# Bewilligungen Directory

Place all 18 Excel authorization files here with the following naming convention:

## Required Files:

1. Bewilligung_Tschida_01_01_25-31_12_25.xlsx
2. Bewilligung_Sweidan_01_04_25-31_10_25.xlsx
3. Bewilligung_Sommermann_01_02_25-31_12_25.xlsx
4. Bewilligung_Rudek_01_01_25-31_12_25.xlsx
5. Bewilligung_Plu_mpe_01_12_24-30_11_25.xlsx
6. Bewilligung_Nakoinz_01_04_25-31_03_226.xlsx
7. Bewilligung_Mankowski_01_01_25-31_12_25.xlsx
8. Bewilligung_Ko_pke_01_06_25-31_12_25.xlsx
9. Bewilligung_Konjetzky_16_08_25-31_12_25.xlsx
10. Bewilligung_Hensler_17_06_25-30_09_25.xlsx
11. Bewilligung_Hennings_19_01_25-31_01_26.xlsx
12. Bewilligung_Gullatz_02-12-2025.xlsx
13. Bewilligung_Fialkowski_01_06_25-30_11_25.xlsx
14. Bewilligung_Dreßler_01_04_25-31_03_26.xlsx
15. Bewilligung_Budach_01_08_25-31_07_26.xlsx
16. Bewilligung_Bollweber_01_01_25-31_12_25.xlsx
17. Bewilligung_Block_16_05_25-30_04_26.xlsx
18. Bewilligung_Alijevic_01_01_25-31_12_25.xlsx

## How it works:

- The application will automatically load and parse these Excel files on startup
- The Excel parser extracts client data, authorization periods, and service details
- If any file is missing or cannot be parsed, fallback data will be used
- The KlientenDropdown component displays all loaded clients with status badges

## File Format:

Each Excel file should contain:
- Client name and Pflegegrad in the header section
- Authorization period (von/bis dates)
- Service table with LK codes, descriptions, frequencies, and prices
