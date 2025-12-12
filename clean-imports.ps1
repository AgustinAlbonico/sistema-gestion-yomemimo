# Script para limpiar imports no utilizados comunes
$files = @(
    "apps\backend\src\modules\sales\dto\create-sale.dto.ts",
    "apps\backend\src\modules\sales\dto\update-sale.dto.ts",
    "apps\backend\src\modules\expenses\dto\create-expense.dto.ts",
    "apps\backend\src\modules\expenses\dto\update-expense.dto.ts",
    "apps\backend\src\modules\incomes\dto\create-income.dto.ts",
    "apps\backend\src\modules\incomes\dto\update-income.dto.ts"
)

$unusedImports = @(
    "IsEnum",
    "Min",
    "MaxLength",
    "IsInt",
    "IsPositive"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        foreach ($import in $unusedImports) {
            # Remover import individual
            $content = $content -replace ",\s*$import\s*,", ","
            $content = $content -replace ",\s*$import\s*\}", "}"
            $content = $content -replace "{\s*$import\s*,", "{"
        }
        
        # Limpiar líneas vacías extras
        $content = $content -replace "(\r?\n){3,}", "`r`n`r`n"
        
        Set-Content $fullPath -Value $content -NoNewline
        Write-Host "Procesado: $file"
    }
}

Write-Host "Limpieza completada"
