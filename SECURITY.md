# Security Policy

## Supported versions

This project is in active development. Security fixes are applied on the default branch.

## Reporting a vulnerability

Please do not open public issues for vulnerabilities.

Report security issues using the contact in `security.txt` and include:

- Summary of the issue
- Affected endpoint or page
- Reproduction steps
- Expected vs actual behavior
- Potential impact

## Baseline controls

- Password hashing with Argon2id
- Secure, HttpOnly session cookies
- CSRF protection for cookie-authenticated actions
- Server-side validation on all API requests
- Authorization checks on protected resources
- Rate limiting for auth and sensitive endpoints
- Security headers via middleware
