import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Renderer2,
  ChangeDetectorRef
} from '@angular/core';
import { Annotation } from './models/annotation.model';
import { PositionService } from './services/position.service';

@Component({
  selector: 'ng-annotation-popup',
  template: `
    <div 
      class="ng-annotate-text-popup" 
      [class.ng-annotate-text-popup-docked-left]="edge === 'left'"
      [class.ng-annotate-text-popup-docked-right]="edge === 'right'"
      [class.ng-annotate-text-popup-docked-top]="edge === 'top'"
      [class.ng-annotate-text-popup-docked-bottom]="edge === 'bottom'">
      
      <div class="popup-content">
        <div class="popup-header">
          <span>{{ isNew ? 'New Annotation' : 'Edit Annotation' }}</span>
          <button *ngIf="!readonly" (click)="reject()">Delete</button>
        </div>
        
        <div class="popup-body">
          <ng-content></ng-content>
          
          <!-- Default content if no template is provided -->
          <div *ngIf="!hasContent">
            <label>
              Comment:
              <textarea [(ngModel)]="annotation.data.comment" 
                        [readonly]="readonly"></textarea>
            </label>
            
            <label>
              Points:
              <input type="number" [(ngModel)]="annotation.data.points" 
                     [readonly]="readonly">
            </label>
          </div>
        </div>
        
        <div class="popup-footer">
          <button *ngIf="!readonly" (click)="close()">
            {{ isNew ? 'Create' : 'Update' }}
          </button>
          <button (click)="close()">
            {{ readonly ? 'Close' : 'Cancel' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ng-annotate-text-popup {
      position: absolute;
      z-index: 1000;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      min-width: 200px;
      max-width: 300px;
    }
    
    .popup-content {
      padding: 10px;
    }
    
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #eee;
    }
    
    .popup-body {
      margin-bottom: 10px;
    }
    
    .popup-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    textarea {
      width: 100%;
      min-height: 60px;
      margin-bottom: 10px;
      padding: 5px;
    }
    
    /* Positioning arrow styles */
    .ng-annotate-text-popup-docked-left:before {
      content: '';
      position: absolute;
      left: -10px;
      top: 50%;
      margin-top: -10px;
      border: 10px solid transparent;
      border-right-color: white;
      z-index: 1;
    }
    
    .ng-annotate-text-popup-docked-right:before {
      content: '';
      position: absolute;
      right: -10px;
      top: 50%;
      margin-top: -10px;
      border: 10px solid transparent;
      border-left-color: white;
      z-index: 1;
    }
    
    .ng-annotate-text-popup-docked-top:before {
      content: '';
      position: absolute;
      top: -10px;
      left: 50%;
      margin-left: -10px;
      border: 10px solid transparent;
      border-bottom-color: white;
      z-index: 1;
    }
    
    .ng-annotate-text-popup-docked-bottom:before {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      margin-left: -10px;
      border: 10px solid transparent;
      border-top-color: white;
      z-index: 1;
    }
  `]
})
export class AnnotationPopupComponent implements AfterViewInit, OnDestroy {
  @Input() annotation!: Annotation;
  @Input() isNew: boolean = false;
  @Input() readonly: boolean = false;
  @Input() anchor!: HTMLElement;
  @Input() offset: number = 10;
  
  edge: string = '';
  hasContent = false;
  
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private positionService: PositionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.checkContent();
    this.appendToBody();
    this.position();
    
    // Re-position on window resize
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = (): void => {
    this.position();
  }

  private checkContent(): void {
    // Check if custom content is provided via content projection
    this.hasContent = this.el.nativeElement.querySelector('ng-content').children.length > 0;
  }

  private appendToBody(): void {
    // Append popup to body for better positioning
    this.renderer.appendChild(document.body, this.el.nativeElement);
  }

  private position(): void {
    if (!this.el || !this.anchor) return;
    
    const position = this.positionService.calculatePosition(
      this.el.nativeElement,
      this.anchor,
      {
        preferredAxis: 'x',
        offset: this.offset
      }
    );
    
    this.renderer.setStyle(this.el.nativeElement, 'top', `${position.top}px`);
    this.renderer.setStyle(this.el.nativeElement, 'left', `${position.left}px`);
    
    this.edge = position.edge || '';
    this.cdr.detectChanges();
  }
  
  close(): void {
    // This will be overridden by the main component
  }
  
  reject(): void {
    // This will be overridden by the main component
  }
  
  stopDestroy(): void {
    // Can be implemented if needed for animation cancellation
  }
} 