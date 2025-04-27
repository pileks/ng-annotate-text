# NgAnnotateText

An Angular library for adding, displaying, and managing text annotations.

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

## Custom Templates

You can create custom popup and tooltip components:

```typescript
import { Component, Input } from '@angular/core';
import { Annotation } from 'ng-annotate-text';

@Component({
  selector: 'app-custom-popup',
  template: `
    <div class="custom-popup">
      <h3>Annotation</h3>
      <textarea [(ngModel)]="annotation.data.comment" placeholder="Enter comment"></textarea>
      <div class="buttons">
        <button (click)="close()">Save</button>
        <button (click)="reject()">Delete</button>
      </div>
    </div>
  `,
  styles: [`
    .custom-popup {
      padding: 15px;
    }
    textarea {
      width: 100%;
      min-height: 100px;
    }
    .buttons {
      margin-top: 10px;
      text-align: right;
    }
  `]
})
export class CustomPopupComponent {
  @Input() annotation!: Annotation;
  @Input() isNew = false;
  @Input() readonly = false;

  close(): void {
    // Will be implemented by the host component
  }

  reject(): void {
    // Will be implemented by the host component
  }
}
```

## Annotation Model

```typescript
export interface AnnotationData {
  points?: number;
  comment?: string;
  [key: string]: any;
}

export class Annotation {
  id: number;
  startIndex: number | null;
  endIndex: number | null;
  type: string;
  data: AnnotationData;
  children: Annotation[];
}
```

## API Reference

### Inputs

| Name | Type | Description |
|------|------|-------------|
| text | string | The text content to annotate |
| annotations | Annotation[] | Array of annotations |
| readonly | boolean | Whether annotations can be added/edited |
| popupComponentType | Type<any> | Component type for annotation popups |
| tooltipComponentType | Type<any> | Component type for annotation tooltips |
| popupOffset | number | Offset in pixels for popups and tooltips |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| annotate | EventEmitter<Annotation> | Emitted when an annotation is created or updated |
| annotateDelete | EventEmitter<Annotation> | Emitted when an annotation is deleted |
| annotateError | EventEmitter<Error> | Emitted when an error occurs during annotation |

## License

MIT License 