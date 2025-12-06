# Security Patches Applied

This document tracks the security patches that have been cherry-picked from upstream Open WebUI into this fork.

## Applied Patches (6 total)

### 1. Pipelines Upload Path Traversal Fix
- **Commit**: `b60940ec8` (original: `a9c22bffc`)
- **Date**: May 14, 2025
- **Severity**: HIGH
- **Description**: Fixed path traversal vulnerability in pipeline file uploads by using `os.path.basename()` to sanitize filenames
- **Files Changed**: `backend/open_webui/routers/pipelines.py`

### 2. Ollama Model Upload Path Traversal Fix
- **Commit**: `d41c01fe7` (original: `3c4accaeb`)
- **Date**: May 14, 2025
- **Severity**: HIGH
- **Description**: Fixed path traversal vulnerability in Ollama model uploads by using `os.path.basename()` to sanitize filenames
- **Files Changed**: `backend/open_webui/routers/ollama.py`

### 3. SSRF Protection with Configurable Blocklist
- **Commit**: `c3f39e784` (original: `02238d311`)
- **Date**: November 18, 2025
- **Severity**: CRITICAL
- **Description**: Added Server-Side Request Forgery (SSRF) protection with configurable blocklist to prevent:
  - Internal port scanning
  - Access to cloud metadata services (AWS, GCP, Azure)
  - Internal service enumeration
  - Private network access
- **Files Changed**: 
  - `backend/open_webui/config.py` (added `WEB_FETCH_FILTER_LIST`)
  - `backend/open_webui/retrieval/web/main.py`
  - `backend/open_webui/retrieval/web/utils.py`
- **Default Blocked IPs**:
  - `169.254.169.254` (AWS metadata)
  - `fd00:ec2::254` (AWS IPv6 metadata)
  - `metadata.google.internal` (GCP metadata)
  - `100.100.100.200` (Alibaba Cloud metadata)

### 4. SVG XSS Protection
- **Commit**: `654cf2a51` (original: `750a659a9`)
- **Date**: September 25, 2025
- **Severity**: HIGH
- **Description**: Fixed Cross-Site Scripting (XSS) vulnerability in SVG rendering by adding DOMPurify sanitization
- **Files Changed**: `src/lib/components/common/SVGPanZoom.svelte`

### 5. WebSocket CORS Validation
- **Commit**: `7faf6ad6c` (original: `25087e09e`)
- **Date**: October 18, 2025
- **Severity**: MEDIUM
- **Description**: Added CORS validation to WebSocket connections for defense-in-depth security
- **Files Changed**: `backend/open_webui/socket/main.py`

### 6. Python Code Format Endpoint Access Control
- **Commit**: `b990b1ed8` (original: `4fe45d443`)
- **Date**: June 8, 2025
- **Severity**: MEDIUM
- **Description**: Restricted Python code formatting endpoint to admin users only; added Pyodide-based formatting for non-admin users
- **Files Changed**: 
  - `backend/open_webui/routers/utils.py`
  - `scripts/prepare-pyodide.js`
  - `src/lib/components/common/CodeEditor.svelte`

## Skipped Patches

### Notes Access Control Fix
- **Original Commit**: `793648bbd`
- **Reason**: Notes feature not present in this fork (removed during refactoring)

## Dependency Updates (Not Applied)

The following dependency security updates were identified but not yet applied:
- `authlib`: 1.4.1 → 1.6.1
- `aiohttp`: 3.11.11 → 3.12.15
- `pydantic`: → 2.11.9

These may be applied in a future update after testing for compatibility.

## Verification

All patches have been applied successfully with:
- No merge conflicts (except for the skipped notes patch)
- No linting errors
- All files validated

## Environment Variables Added

### WEB_FETCH_FILTER_LIST
Configure domains/IPs allowed or blocked for web fetching:
- Use `!` prefix to block domains (e.g., `!169.254.169.254`)
- Without `!` prefix to allow domains
- Default blocks cloud metadata endpoints

Example:
```bash
WEB_FETCH_FILTER_LIST="!169.254.169.254,!metadata.google.internal,example.com"
```

---

**Last Updated**: December 6, 2025
