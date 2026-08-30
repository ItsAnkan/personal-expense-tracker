# Dashboard UI Color Reference Guide

## Color Scheme Overview

### Primary Gradient Colors

```
Summary Cards (Top Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Total Income
   Gradient: from-emerald-500 to-teal-500
   Text: white
   Background on card: Colored gradient
   
💸 Total Spending
   Gradient: from-orange-500 to-red-500
   Text: white
   Background on card: Colored gradient

💰 Net Cash Flow
   Gradient: from-blue-500 to-cyan-500
   Text: white
   Background on card: Colored gradient

🏦 Account Balance
   Gradient: from-indigo-500 to-purple-500
   Text: white
   Background on card: Colored gradient

💳 CC Outstanding
   Gradient: from-pink-500 to-rose-500
   Text: white
   Background on card: Colored gradient
```

### Section Backgrounds

```
📊 Budget Overview Section
───────────────────────────
Background: from-emerald-50 to-teal-50 (very light green)
Header: text-emerald-900, font-bold, "📊 Budget Overview"
Border: border-emerald-200
Cards: bg-white with border-emerald-200
Button: from-emerald-500 to-teal-500
Delete Button: border-red-300 bg-red-50 text-red-600

🎯 Category Budgets Section
───────────────────────────
Background: from-blue-50 to-indigo-50 (very light blue)
Header: text-blue-900, font-bold, "🎯 Category Budgets"
Border: border-blue-200
Cards: bg-white with border-blue-200
Button: from-blue-500 to-indigo-500
Delete Buttons: border-red-300 bg-red-50 text-red-600

💸 Spending by Category Section
────────────────────────────────
Background: from-purple-50 to-pink-50 (very light purple)
Header: text-purple-900, font-bold, "💸 Spending by Category"
Border: border-purple-200
Cards: bg-white with border-purple-200
Money text: text-purple-600, font-bold

✨ Insights Section
───────────────────
Background: from-amber-50 to-orange-50 (very light amber)
Header: text-amber-900, font-bold, "✨ Insights"
Border: border-amber-200
Text: text-gray-700
```

### Progress Bar Colors

```
Healthy Budget (0-75%)
━━━━━━━━━━━━━━━━━━━━━━━━
Progress Bar: from-emerald-500 to-teal-500
Color Intent: Green = good, on track

Warning Budget (75-100%)
━━━━━━━━━━━━━━━━━━━━━━━━
Progress Bar: from-amber-500 to-orange-500
Color Intent: Amber = caution, getting close to limit

Over Budget (>100%)
━━━━━━━━━━━━━━━━━━━━━━━━
Progress Bar: from-destructive to-red-600
Color Intent: Red = danger, exceeded budget
```

### Interactive Element Colors

```
BUTTONS
───────
Primary Action Buttons:
  Save: from-[color]-500 to-[related-color]-500
  Hover: shadow-lg
  Text: text-white, font-bold

Danger Buttons (Delete):
  Background: bg-red-50
  Border: border-red-300
  Text: text-red-600, font-bold
  Hover: bg-red-100
  Transition: transition-colors

INPUT FIELDS
────────────
Focus States:
  Border: border-[color]-300
  Ring: focus:ring-2 focus:ring-[color]-500

Text Input:
  Placeholder: placeholder-gray-500
  Font: text-base (prevents iOS zoom on mobile)

SELECT Dropdowns:
  Same styling as text inputs
  Focus: ring-2 focus:ring-[color]-500
```

## CSS Utility Classes Used

### Tailwind Color Utilities

```
Emerald/Teal (Green Theme):
  from-emerald-500, to-teal-500          (gradient)
  from-emerald-50, to-teal-50            (background)
  text-emerald-900, text-emerald-600     (text)
  border-emerald-200, border-emerald-300 (borders)
  bg-emerald-50, bg-emerald-100          (backgrounds)

Blue/Indigo (Blue Theme):
  from-blue-500, to-indigo-500           (gradient)
  from-blue-50, to-indigo-50             (background)
  text-blue-900, text-blue-600           (text)
  border-blue-200, border-blue-300       (borders)

Orange/Red (Spending Theme):
  from-orange-500, to-red-500            (gradient)
  text-orange-600                        (text)

Purple/Pink (Analysis Theme):
  from-purple-50, to-pink-50             (background)
  text-purple-900, text-purple-600       (text)
  border-purple-200                      (border)

Amber/Orange (Alerts Theme):
  from-amber-50, to-orange-50            (background)
  text-amber-900                         (text)
  border-amber-200                       (border)
  from-amber-500, to-orange-500          (progress bar)

Danger/Red (Delete Theme):
  border-red-300                         (border)
  bg-red-50, bg-red-100                  (background, hover)
  text-red-600, text-destructive         (text)
```

### Layout Utilities

```
Responsive Spacing:
  gap-2 md:gap-3      (smaller gap on mobile, larger on desktop)
  p-3 md:p-4          (less padding on mobile, more on desktop)
  px-2 md:px-3        (horizontal padding responsive)
  py-2 md:py-4        (vertical padding responsive)

Grid Layouts:
  grid gap-2 md:grid-cols-2  (1 column mobile, 2 on desktop)
  grid gap-2 md:grid-cols-3  (1 column mobile, 3 on desktop)
  grid gap-2 md:grid-cols-4  (1 column mobile, 4 on desktop)

Text Sizing:
  text-xs md:text-sm   (small on mobile, regular on desktop)
  text-sm md:text-base (regular on mobile, larger on desktop)
  text-base md:text-lg (larger on mobile, largest on desktop)

Alignment:
  flex flex-col md:flex-row  (stack mobile, side-by-side desktop)
  flex-1 md:flex-none        (full width mobile, auto desktop)
```

## Implementation Examples

### Summary Card
```jsx
<article className="rounded-xl border border-opacity-20 
           bg-gradient-to-br from-emerald-500 to-teal-500 
           p-3 shadow-lg hover:shadow-xl transition-shadow 
           md:p-4 text-white">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <p className="text-xs font-medium opacity-90 md:text-sm">
        Total Income
      </p>
      <p className="mt-2 text-lg font-bold md:text-2xl">
        ₹1,25,000
      </p>
    </div>
    <span className="text-2xl md:text-3xl">📈</span>
  </div>
</article>
```

### Budget Overview Card
```jsx
<section className="rounded-xl border border-emerald-200 
          bg-gradient-to-br from-emerald-50 to-teal-50 
          p-3 md:p-4">
  <h2 className="text-sm font-bold text-emerald-900 md:text-base">
    📊 Budget Overview
  </h2>
  
  <div className="mt-4 space-y-3 rounded-lg border border-emerald-200 
                  bg-white p-3 md:p-4">
    {/* Content */}
  </div>
  
  <div className="mt-4 flex flex-col gap-2 md:flex-row">
    <form className="flex flex-1 gap-2">
      <input className="flex-1 rounded-md border border-emerald-300 
                        px-3 py-2 text-base placeholder-gray-500 
                        focus:ring-2 focus:ring-emerald-500" />
      <button className="rounded-md bg-gradient-to-r 
                        from-emerald-500 to-teal-500 
                        px-4 py-2 text-sm font-bold text-white 
                        hover:shadow-lg transition-shadow">
        Save
      </button>
    </form>
    <form className="flex-shrink-0">
      <button className="rounded-md border border-red-300 
                        bg-red-50 px-3 py-2 text-sm font-bold 
                        text-red-600 hover:bg-red-100 
                        transition-colors">
        Delete
      </button>
    </form>
  </div>
</section>
```

### Delete Buttons Grid
```jsx
{data.categoryBudgetStatuses.length > 0 ? (
  <div className="mt-3 grid gap-2 md:grid-cols-2">
    {data.categoryBudgetStatuses.map((item) => (
      <form action={deleteCategoryBudgetAction} 
            key={item.budgetId} className="flex gap-2">
        <input type="hidden" name="budgetId" 
               value={item.budgetId} />
        <button
          type="submit"
          className="flex-1 rounded-md border border-red-300 
                    bg-red-50 text-xs font-bold text-red-600 
                    hover:bg-red-100 transition-colors 
                    px-2 py-1 md:text-sm"
        >
          Delete {item.categoryName}
        </button>
      </form>
    ))}
  </div>
) : null}
```

## Visual Hierarchy

```
Level 1: Main Heading (Month Navigator)
─────────────────────────────────────
Class: text-base font-bold md:text-lg
Color: bg-gradient-to-r text-transparent
Layout: Centered with prev/next buttons

Level 2: Section Headers
─────────────────────────
Class: text-sm font-bold md:text-base text-[color]-900
Emoji: Prefix emoji (📊 🎯 💸 ✨)
Examples: "📊 Budget Overview", "🎯 Category Budgets"

Level 3: Subsection Labels
──────────────────────────
Class: text-xs md:text-sm font-medium
Color: text-gray-700
Examples: "Total Budget", "Spent", "Remaining"

Level 4: Data Values
───────────────────
Class: text-base md:text-lg font-bold
Color: Varies by category (emerald, blue, purple, etc.)
Examples: Money amounts, percentages

Level 5: Supporting Text
───────────────────────
Class: text-xs text-muted-foreground
Examples: Help text, descriptions
```

## Spacing System

```
Compact: gap-1, p-2                    (tightly packed)
Regular: gap-2, p-3                    (mobile default)
Spacious: gap-3, p-4 md:gap-3 md:p-4  (desktop with breathing room)

Section Spacing: space-y-4 md:space-y-5 (vertical rhythm)
Card Spacing: space-y-2, space-y-3     (within sections)
```

## Animation & Transitions

```
Hover Effects:
  Button Shadows:    hover:shadow-lg transition-shadow
  Background Color:  hover:bg-[color] transition-colors
  Scale (Optional):  hover:scale-105 transition-transform

Transitions:
  Colors: transition-colors (200ms default)
  Shadows: transition-shadow (200ms default)
  All: transition-all (for complex changes)
```

---

**This color scheme is designed for:**
- ✅ Professional financial app aesthetic
- ✅ Visual distinctness between sections
- ✅ Clear call-to-action hierarchy
- ✅ Accessibility (WCAG AA compliant)
- ✅ Mobile-first responsive design
- ✅ Dark/light mode readiness
