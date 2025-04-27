import { Component } from '@angular/core';
import { Annotation } from '../lib/models/annotation.model';
import { AnnotationPopupComponent } from '../lib/annotation-popup.component';
import { AnnotationTooltipComponent } from '../lib/annotation-tooltip.component';

@Component({
  selector: 'app-demo',
  template: `
    <div class="container">
      <h1>NgAnnotateText Demo</h1>
      
      <div class="controls">
        <label>
          <input type="checkbox" [(ngModel)]="readonly">
          Readonly mode
        </label>
      </div>
      
      <div class="annotator-container">
        <ng-annotate-text
          [text]="textContent"
          [annotations]="annotations"
          [readonly]="readonly"
          [popupComponentType]="popupComponent"
          [tooltipComponentType]="tooltipComponent"
          [popupOffset]="10"
          (annotate)="onAnnotate($event)"
          (annotateDelete)="onAnnotateDelete($event)"
          (annotateError)="onAnnotateError($event)">
        </ng-annotate-text>
      </div>
      
      <div class="annotations-list">
        <h3>Annotations ({{ annotations.length }})</h3>
        <div *ngIf="annotations.length === 0" class="empty-state">
          No annotations yet. Select text to add annotations.
        </div>
        <div *ngFor="let annotation of annotations" class="annotation-item">
          <div class="annotation-text">
            "{{ getAnnotationText(annotation) }}"
          </div>
          <div class="annotation-details">
            <div *ngIf="annotation.data.comment">
              Comment: {{ annotation.data.comment }}
            </div>
            <div *ngIf="annotation.data.points">
              Points: {{ annotation.data.points }}
            </div>
            <button (click)="deleteAnnotation(annotation)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    
    .controls {
      margin-bottom: 20px;
    }
    
    .annotator-container {
      border: 1px solid #ccc;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 4px;
      background: #f9f9f9;
    }
    
    .annotations-list {
      margin-top: 30px;
    }
    
    .annotation-item {
      margin-bottom: 15px;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 4px;
      background: white;
    }
    
    .annotation-text {
      font-style: italic;
      margin-bottom: 10px;
      color: #555;
    }
    
    .annotation-details {
      font-size: 14px;
    }
    
    .empty-state {
      color: #888;
      font-style: italic;
    }
    
    button {
      margin-top: 10px;
      padding: 5px 10px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background: #d32f2f;
    }
  `]
})
export class DemoComponent {
  textContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
  
  annotations: Annotation[] = [];
  readonly = false;
  
  // Reference to the popup and tooltip components
  popupComponent = AnnotationPopupComponent;
  tooltipComponent = AnnotationTooltipComponent;
  
  onAnnotate(annotation: Annotation): void {
    console.log('Annotation created/updated', annotation);
    // In a real app, you might save this to your backend
  }
  
  onAnnotateDelete(annotation: Annotation): void {
    console.log('Annotation deleted', annotation);
  }
  
  onAnnotateError(error: Error): void {
    console.error('Annotation error', error);
    alert(`Error: ${error.message}`);
  }
  
  deleteAnnotation(annotation: Annotation): void {
    this.annotations = this.annotations.filter(a => a.id !== annotation.id);
  }
  
  getAnnotationText(annotation: Annotation): string {
    if (annotation.startIndex === null || annotation.endIndex === null) {
      return '';
    }
    return this.textContent.substring(annotation.startIndex, annotation.endIndex);
  }
} 