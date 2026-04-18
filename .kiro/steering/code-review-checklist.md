---
inclusion: always
---

# Code Review Checklist

## General
- [ ] Code follows project standards
- [ ] No commented-out code (unless temporary debugging)
- [ ] No console.log statements in production code
- [ ] Error handling implemented
- [ ] Logging appropriate for debugging
- [ ] Performance considerations addressed

## Backend (Python)
- [ ] Type hints for all functions
- [ ] PEP 8 compliance
- [ ] Proper exception handling
- [ ] SQL injection prevention
- [ ] Input validation
- [ ] Environment variables used (no hardcoded secrets)
- [ ] Database queries optimized
- [ ] Async/await used appropriately
- [ ] API endpoints documented

## Frontend (TypeScript/React)
- [ ] TypeScript strict mode compliance
- [ ] No `any` types (use proper interfaces)
- [ ] React hooks used correctly
- [ ] No unnecessary re-renders
- [ ] Proper component structure
- [ ] Error boundaries implemented
- [ ] Loading states for async operations
- [ ] Accessibility considerations
- [ ] Responsive design

## Security
- [ ] No secrets in code
- [ ] Input validation on all endpoints
- [ ] Authentication checks
- [ ] Authorization checks
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] SQL injection prevention
- [ ] XSS protection

## Testing
- [ ] Unit tests written
- [ ] Integration tests for critical paths
- [ ] Edge cases tested
- [ ] Mock data used appropriately
- [ ] Test coverage adequate

## Performance
- [ ] Database queries optimized
- [ ] Frontend bundle size optimized
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Caching strategy

## Documentation
- [ ] Code comments for complex logic
- [ ] API endpoints documented
- [ ] README updated if needed
- [ ] Environment variables documented

## Git & Version Control
- [ ] Meaningful commit messages
- [ ] No large binary files committed
- [ ] Branch naming follows convention
- [ ] Pull request description complete
- [ ] No merge conflicts