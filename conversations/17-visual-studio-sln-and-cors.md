# 17 – Solution File and Visual Studio CORS / HTTPS Fix

This file records the final fix session: adding the root Visual Studio solution (`.sln`) file and resolving the HTTPS redirection and CORS issue encountered when running the backend in Visual Studio.

---

## Issue 1: Missing `.sln` File for Visual Studio

### Problem
The project contained `src/Horizon.EquipmentTracker.Api/Horizon.EquipmentTracker.Api.csproj`, but no root solution file existed for opening the project in Visual Studio.

### Fix
Created `Horizon.EquipmentTracker.sln` at the repository root and added the API project:
```bash
dotnet new sln -n Horizon.EquipmentTracker
dotnet sln Horizon.EquipmentTracker.sln add src/Horizon.EquipmentTracker.Api/Horizon.EquipmentTracker.Api.csproj
```

---

## Issue 2: CORS and HTTPS Redirection Error in Visual Studio

### Problem
When launching the backend in Visual Studio, it defaults to the `https` profile (`https://localhost:7152` and `http://localhost:5186`).
Because `app.UseHttpsRedirection()` was executed unconditionally, any requests proxied by Vite (`http://localhost:5173/api/...`) to `http://localhost:5186` were returned an HTTP 307 Temporary Redirect to `https://localhost:7152`.
The browser followed this redirect directly to port 7152, resulting in:
1. Cross-origin request from `http://localhost:5173` to `https://localhost:7152`.
2. Rejection by CORS policy (`No 'Access-Control-Allow-Origin' header is present`).
3. Self-signed developer SSL certificate mismatch (`net::ERR_FAILED`).

### Fix
In `src/Horizon.EquipmentTracker.Api/Program.cs`:
1. Disabled `UseHttpsRedirection` in the Development environment:
   ```csharp
   if (app.Environment.IsDevelopment())
   {
       app.UseSwagger();
       app.UseSwaggerUI();
   }
   else
   {
       app.UseHttpsRedirection();
   }
   ```
2. Added default CORS policy allowing the Vite client (`http://localhost:5173`):
   ```csharp
   builder.Services.AddCors(options =>
   {
       options.AddDefaultPolicy(policy =>
       {
           policy.WithOrigins("http://localhost:5173")
                 .AllowAnyHeader()
                 .AllowAnyMethod();
       });
   });

   // ...
   app.UseCors();
   app.UseAuthorization();
   ```

---

## Verification
- Frontend production build (`npm run build`): Completed with 0 warnings, 0 errors.
- Backend solution build (`dotnet build Horizon.EquipmentTracker.sln`): Completed with 0 warnings, 0 errors.
