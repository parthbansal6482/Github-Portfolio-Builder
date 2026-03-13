---
name: Portfolio Template Creation
description: How to scaffold and integrate a new design system template for the GitFolio portfolio builder.
---

# Creating a New Portfolio Template

This skill outlines the necessary steps to create a new design template within the Github-Portfolio-Builder application. The architecture is modular: templates consume a `Portfolio` object and are registered within an orchestrator.

## 1. Directory Structure
Templates are located in `frontend/src/components/templates/`. 

When creating a new template (e.g., "Glassmorphism"):
1. Create a new directory: `frontend/src/components/templates/Glassmorphism/`.
2. Create an `index.tsx` file in that directory as the main entry point.
3. Split the design into multiple section components (e.g., `HeroSection.tsx`, `AboutSection.tsx`, `ProjectsSection.tsx`, `FooterSection.tsx`) to keep files manageable.

## 2. Template Interface
All templates **must** accept `TemplateProps` defined in `frontend/src/components/templates/types.ts`:

```typescript
import type { Portfolio } from '@/types';

export interface TemplateProps {
  portfolio: Portfolio;
  username: string;
}
```

The `Portfolio` object contains:
- `githubData`: Raw profile and repository data.
- `preferences`: User custom styling choices (theme/vibe/accent color).
- `generatedCopy`: AI-generated content (headline, about, project descriptions).

## 3. Data Handling Guidelines
1. **Fallback Copy**: The `generatedCopy` object might be a `FallbackCopy` if AI generation failed, but it has the same shape. Always consume it defensively.
2. **Missing Copy**: If `copy` is null entirely, render a minimal fallback or an error boundary.
3. **Accent Colors**: The user can pick custom colors (`preferences.accentColor`). Incorporate this color into the theme meaningfully (buttons, borders, text highlights).
4. **Vibe Mapping**: Try to map `preferences.vibe` to the design language if the template is flexible, or enforce a strict design pattern (e.g., Neo-Brutalism enforces strict contrasts regardless of minor vibe settings).

## 4. Registering the Template
Once the template components are created, it must be registered in the orchestrator: `frontend/src/app/portfolio/[username]/PortfolioViewClient.tsx`.

1. Import the template:
```tsx
import NewThemeTemplate from '@/components/templates/NewTheme';
```

2. Add it to the switch case based on the `portfolio.templateId`:
```tsx
switch (templateId) {
  case 'new-theme-id':
    return <NewThemeTemplate portfolio={portfolio} username={username} />;
  case 'neo-brutalism':
    return <NeoBrutalismTemplate portfolio={portfolio} username={username} />;
  default:
    return <DefaultTemplate portfolio={portfolio} username={username} />;
}
```

## 5. Prompting for Design Patterns
When a user asks for a new template using a specific design pattern (e.g., "Make a clean minimal theme" or "Use a cyberpunk aesthetic"), you should:
1. **Analyze the pattern**: Determine the core styling tenets of that aesthetic (colors, borders, shadows, typography, layout asymmetry).
2. **Design the sections**: Scaffold the `index.tsx` as a wrapper and pass the relevant data chunks down to specific sections.
3. **Avoid monolithic rendering**: Keep `index.tsx` under 100 lines by delegating work to the sub-components.
4. **CSS/Styling**: Use inline styles or Tailwind strictly within the component files. Do not leak global classes unless necessary.
