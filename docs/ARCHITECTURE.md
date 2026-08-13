# Architecture

## Backend layering

```text
Route (routes/api.php, v1 prefix)
  -> Middleware (auth:sanctum, throttle, ForceJsonResponse)
    -> Controller (extends BaseApiController)
      -> FormRequest validation
        -> Service (business rules)
          -> Repository interface -> Eloquent repository
            -> Model
```

Rules:

- Controllers never touch Eloquent directly; they call services.
- Services never build HTTP responses; they return data or throw domain exceptions.
- Repositories are bound to interfaces in `App\Providers\RepositoryServiceProvider`.
- All API responses go through `BaseApiController::respond*` for a stable envelope.

Response envelope:

```json
{ "success": true, "data": {}, "message": null, "meta": {} }
```

Errors are rendered centrally in `bootstrap/app.php` via the exception handler.

## API versioning

All routes are mounted under `/api/v1`. A new major version adds
`app/Http/Controllers/Api/V2` and a matching route group; V1 remains untouched.

## Frontend layering

```text
core/      singletons: ApiService, AuthService, interceptors, guards
shared/    reusable presentational components, pipes, directives
features/  lazy-loaded route bundles (auth, dashboard, ...)
```

- Standalone components only; no NgModules.
- State handled with Angular signals in injectable services.
- Forms use Reactive Forms with typed form groups.
- HTTP passes through `apiInterceptor` (base URL, credentials) and
  `errorInterceptor` (central error normalisation).

## Phase plan

1. Scaffold and infrastructure (this phase)
2. Database schema, migrations, models
3. Authentication and user management
4. Loan domain modules
5. Reporting and exports
