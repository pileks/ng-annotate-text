# NgAnnotateText

An Angular library for adding, displaying, and managing text annotations. This library has been rewritten from the original AngularJS version to work with modern Angular (2+).

![Screenshot](screenshot.png)

## Features

- Add annotations to text by selecting portions of text
- Show tooltips with annotation details on hover
- Create hierarchical (nested) annotations
- Customizable popup and tooltip templates
- Support for readonly mode
- Full TypeScript support

## Installation

```bash
npm install ng-annotate-text --save
```

## Usage

1. Import the module in your app:

```typescript
import { NgAnnotateTextModule } from 'ng-annotate-text';

@NgModule({
  imports: [
    // ...
    NgAnnotateTextModule
  ]
})
export class AppModule { }
```

2. Use the component in your templates:

```html
<ng-annotate-text
  [text]="textContent"
  [annotations]="annotations"
  [readonly]="false"
  [popupComponentType]="CustomPopupComponent"
  [tooltipComponentType]="CustomTooltipComponent"
  [popupOffset]="10"
  (annotate)="onAnnotate($event)"
  (annotateDelete)="onAnnotateDelete($event)"
  (annotateError)="onAnnotateError($event)">
</ng-annotate-text>
```

3. Define your annotations in the component:

```typescript
import { Component } from '@angular/core';
import { Annotation } from 'ng-annotate-text';

@Component({
  selector: 'app-annotator',
  templateUrl: './annotator.component.html'
})
export class AnnotatorComponent {
  textContent = 'This is a sample text that can be annotated.';
  annotations: Annotation[] = [];

  onAnnotate(annotation: Annotation): void {
    console.log('Annotation created/updated', annotation);
    // You can save this to your backend
  }

  onAnnotateDelete(annotation: Annotation): void {
    console.log('Annotation deleted', annotation);
  }

  onAnnotateError(error: Error): void {
    console.error('Annotation error', error);
  }
}
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Open your browser at `http://localhost:4200`

## Building the Library

```bash
npm run build
```

## Upgrading from AngularJS Version

This is a complete rewrite of the original AngularJS library, designed to work with modern Angular. If you're migrating from the AngularJS version:

- The component name remains `ng-annotate-text` for easier migration
- The annotation model structure is preserved
- Templates are now component-based instead of URL-based
- Event handling follows Angular's event binding syntax

## License

MIT License
