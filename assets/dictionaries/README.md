# ECDICT assets

Generated offline dictionary files live here.

- `ecdict.mini.csv`: optional source downloaded from the upstream ECDICT repo
- `ecdict.json`: generated compact index consumed by `background.js`

Build command:

```powershell
node .\tools\build-ecdict.js
```