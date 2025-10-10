# SCSS Architecture – Web Application Version 1.00

## File Structure
```
styles/
  _variables.scss
  _mixins.scss
  _buttons.scss
  _cards.scss
  _forms.scss
  _layout.scss
  _utilities.scss
  main.scss
```

## Variables (`_variables.scss`)
```scss
$color-accent-primary: #2563eb;
$color-accent-deep: #1d4ed8;
$color-neutral-900: #0b1b3f;
$color-neutral-100: #f1f5f9;
$shadow-soft: 0 12px 24px -12px rgba(15, 23, 42, 0.25);
$shadow-medium: 0 20px 40px -20px rgba(15, 23, 42, 0.28);
$radius-lg: 24px;
$radius-pill: 9999px;
$transition-fast: 150ms ease;
$transition-medium: 220ms ease;
```

## Mixins (`_mixins.scss`)
```scss
@mixin card-base {
  border-radius: $radius-lg;
  border: 1px solid rgba(226, 232, 240, 1);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: $shadow-soft;
  backdrop-filter: blur(6px);
}

@mixin button-variant($bg, $color, $border: transparent) {
  background: $bg;
  color: $color;
  border: 1px solid $border;
  border-radius: $radius-pill;
  font-weight: 600;
  padding: 0 1.75rem;
  height: 3.5rem;
  transition: transform $transition-fast, box-shadow $transition-medium;
}
```

## Buttons (`_buttons.scss`)
```scss
.primary-button {
  @include button-variant(linear-gradient(135deg, $color-accent-primary, $color-accent-deep), #fff);
  box-shadow: 0 24px 48px -16px rgba(37, 99, 235, 0.35);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 28px 54px -16px rgba(37, 99, 235, 0.45);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 4px solid rgba(37, 99, 235, 0.24);
    outline-offset: 4px;
  }
}

.secondary-button {
  @include button-variant(transparent, $color-accent-primary, $color-accent-primary);
  background: rgba(37, 99, 235, 0.04);

  &:hover {
    background: rgba(37, 99, 235, 0.12);
  }
}
```

## Cards (`_cards.scss`)
```scss
.card {
  @include card-base;
  padding: clamp(1.5rem, 1.5vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &--metric {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(56, 189, 248, 0.08));
  }

  &--testimonial {
    background: linear-gradient(145deg, #1d4ed8 0%, #2563eb 60%, rgba(56, 189, 248, 0.4) 100%);
    color: #fff;
  }
}
```

## Forms (`_forms.scss`)
```scss
.form-input {
  border-radius: 12px;
  border: 1px solid #cbd5f5;
  padding: 0 1.25rem;
  height: 3.5rem;
  transition: border $transition-fast, box-shadow $transition-fast;

  &:focus {
    border-color: $color-accent-primary;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  }

  &.is-error {
    border-color: #ef4444;
  }
}
```

## Layout (`_layout.scss`)
```scss
.hero {
  background: linear-gradient(115deg, #0b1b3f 0%, #1d4ed8 48%, #38bdf8 100%);
  color: #fff;
  padding-block: clamp(6rem, 12vw, 8rem);
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: clamp(2rem, 4vw, 4rem);

  @media (max-width: 64rem) {
    grid-template-columns: 1fr;
  }
}
```

## Utilities (`_utilities.scss`)
```scss
.shadow-soft { box-shadow: $shadow-soft; }
.shadow-accent { box-shadow: 0 24px 48px -16px rgba(37, 99, 235, 0.35); }
.rounded-pill { border-radius: $radius-pill; }
.text-accent { color: $color-accent-primary; }
.bg-surface { background: rgba(255, 255, 255, 0.92); }
```

## Compilation (`main.scss`)
```scss
@use 'variables';
@use 'mixins';
@use 'buttons';
@use 'cards';
@use 'forms';
@use 'layout';
@use 'utilities';
```
