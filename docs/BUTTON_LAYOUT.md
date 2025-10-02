# Button Layout Documentation

## Control Button Positioning System

The ChatLaLiLuLeLo UI uses a horizontal button layout positioned at the top of the screen. All buttons use `position: absolute` with `left: 50%` and different `marginLeft` values to create proper spacing.

### Button Layout (Left to Right)

```
[MODE: JD] ←-150px→ [CRT: ON] ←-50px→ [THEME: CYBRIG] ←-150px→ [DEBUG: OFF] ←-170px→ [CONN: OFF]
   -200px            -50px              100px                 250px              420px
```

### Spacing Details

| Button | Component | MarginLeft | Gap from Previous |
|--------|-----------|------------|------------------|
| **MODE** | `ModeToggle` | `-200px` | - (leftmost) |
| **CRT** | `CRTToggle` | `-50px` | `150px` |
| **THEME** | `ThemeCycleToggle` | `100px` | `150px` |
| **DEBUG** | `DebugToggle` | `250px` | `150px` ⭐ |
| **CONN** | `ConnectionDebugToggle` | `420px` | `170px` |

### Key Design Principles

1. **No Overlaps**: Each button has sufficient space (minimum 150px gaps)
2. **Visual Balance**: Buttons are distributed across the top bar
3. **Theme Awareness**: All buttons adapt to current theme colors
4. **Responsive**: Layout works across different screen sizes
5. **Logical Grouping**: 
   - Core controls (MODE, CRT, THEME) on the left
   - Debug controls (DEBUG, CONN) on the right
   - User profile area remains clear on far right

### Recent Fixes

- **v1**: DEBUG button was overlapping with THEME button (150px → 100px gap too small)
- **v2**: Fixed by increasing DEBUG marginLeft: `150px → 250px` (creating 150px gap)
- **v3**: Adjusted CONN button accordingly: `380px → 420px` to maintain spacing

### Button Widths (Approximate)

- MODE: ~80px
- CRT: ~80px  
- THEME: ~120px
- DEBUG: ~100px
- CONN: ~120px

This layout ensures professional appearance and prevents UI overlap issues across all ChatLaLiLuLeLo themes.
