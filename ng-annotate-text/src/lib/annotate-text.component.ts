import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ElementRef, 
  ViewEncapsulation,
  OnChanges, 
  SimpleChanges, 
  AfterViewInit,
  OnDestroy,
  ViewContainerRef,
  Injector,
  ComponentFactoryResolver, 
  ChangeDetectorRef,
  Type,
  ComponentRef
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Annotation } from './models/annotation.model';
import { parseAnnotations, getAnnotationById, removeAnnotation, removeChildren } from './utils/annotation-utils';
import { AnnotationPopupComponent } from './annotation-popup.component';
import { AnnotationTooltipComponent } from './annotation-tooltip.component';

// Define interfaces for component instances
export interface PopupComponentInstance {
  annotation: Annotation;
  isNew: boolean;
  readonly: boolean;
  anchor: HTMLElement;
  offset: number;
  close: () => void;
  reject: () => void;
  stopDestroy?: () => void;
}

export interface TooltipComponentInstance {
  annotation: Annotation;
  anchor: HTMLElement;
  offset: number;
  stopDestroy?: () => void;
}

@Component({
  selector: 'ng-annotate-text',
  template: `<div [innerHTML]="contentHtml" (mouseup)="onMouseUp($event)"></div>`,
  styles: [`
    :host {
      display: block;
    }
    
    .ng-annotate-text-annotation {
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class AnnotateTextComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() text: string = '';
  @Input() annotations: Annotation[] = [];
  @Input() readonly: boolean = false;
  @Input() popupComponentType: Type<any> | null = null;
  @Input() tooltipComponentType: Type<any> | null = null;
  @Input() popupOffset: number = 10;

  @Output() annotate = new EventEmitter<Annotation>();
  @Output() annotateDelete = new EventEmitter<Annotation>();
  @Output() annotateError = new EventEmitter<Error>();

  contentHtml: SafeHtml = '';
  private activePopup: ComponentRef<PopupComponentInstance> | null = null;
  private activeTooltip: ComponentRef<TooltipComponentInstance> | null = null;
  private eventListeners: { element: HTMLElement, type: string, handler: EventListener }[] = [];

  constructor(
    private elementRef: ElementRef,
    private sanitizer: DomSanitizer,
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
    private componentFactoryResolver: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text'] || changes['annotations']) {
      this.updateContent();
    }
  }

  ngAfterViewInit(): void {
    this.attachEventListeners();
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
    this.clearPopups();
  }

  private updateContent(): void {
    if (!this.text || !this.text.length) {
      this.contentHtml = '';
      return;
    }

    const parsedHtml = parseAnnotations(this.text, this.annotations);
    this.contentHtml = this.sanitizer.bypassSecurityTrustHtml(parsedHtml);
    this.cdr.detectChanges();
  }

  private attachEventListeners(): void {
    const element = this.elementRef.nativeElement;
    
    // Add event listeners for annotation spans
    const addListener = (el: HTMLElement, type: string, handler: EventListener) => {
      el.addEventListener(type, handler);
      this.eventListeners.push({ element: el, type, handler });
    };

    // For mouseover/mouseout on spans
    const mouseEnterHandler = (event: Event) => this.onMouseEnter(event);
    const mouseLeaveHandler = (event: Event) => this.onMouseLeave(event);

    // Use event delegation for span events
    addListener(element, 'mouseover', (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'SPAN' && target.hasAttribute('data-annotation-id')) {
        mouseEnterHandler(event);
      }
    });

    addListener(element, 'mouseout', (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'SPAN' && target.hasAttribute('data-annotation-id')) {
        mouseLeaveHandler(event);
      }
    });
  }

  private removeEventListeners(): void {
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.eventListeners = [];
  }

  onMouseUp(event: MouseEvent): void {
    const selection = window.getSelection();
    if (!selection) return;

    // Handle text selection
    if (!selection.isCollapsed && !this.readonly) {
      this.handleTextSelection(event);
    } 
    // Handle annotation click
    else if (selection.isCollapsed && (event.target as HTMLElement).tagName === 'SPAN') {
      this.handleAnnotationClick(event);
    } 
    // Clear popups when clicking elsewhere
    else if (selection.isCollapsed) {
      this.clearPopups();
    }
  }

  private handleTextSelection(event: MouseEvent): void {
    if (!this.popupComponentType) return;

    try {
      const annotation = this.createAnnotation();
      this.updateContent();
      this.cdr.detectChanges();
      
      // Find the newly created span
      setTimeout(() => {
        const span = this.elementRef.nativeElement.querySelector(`.ng-annotate-text-${annotation.id}`);
        if (span) {
          this.clearPopups();
          this.createAnnotationPopup(annotation, span, true);
        }
      }, 0);
    } catch (ex) {
      if (ex instanceof Error) {
        this.annotateError.emit(ex);
      }
    }
  }

  private handleAnnotationClick(event: MouseEvent): void {
    if (!this.popupComponentType) return;

    const target = event.target as HTMLElement;
    const targetId = target.getAttribute('data-annotation-id');
    if (!targetId) return;

    const id = parseInt(targetId, 10);
    
    if (this.activePopup && this.activePopup.instance.annotation.id === id) {
      this.clearPopup();
      return;
    }

    const annotation = getAnnotationById(this.annotations, id);
    if (!annotation) return;

    this.clearPopups();
    this.createAnnotationPopup(annotation, target, false);
  }

  private onMouseEnter(event: Event): void {
    if (!this.tooltipComponentType) return;

    event.stopPropagation();
    const target = event.target as HTMLElement;
    const targetId = target.getAttribute('data-annotation-id');
    if (!targetId) return;

    const id = parseInt(targetId, 10);

    if (this.activeTooltip && this.activeTooltip.instance.annotation.id === id) {
      // Stop the destroy timeout if any
      if (this.activeTooltip.instance.stopDestroy) {
        this.activeTooltip.instance.stopDestroy();
      }
      return;
    } else {
      this.clearTooltip();
    }

    const annotation = getAnnotationById(this.annotations, id);
    if (!annotation) return;

    // Don't show tooltip if popup is open or no content to show
    if (this.activePopup || (!annotation.data.comment && !annotation.data.points)) {
      return;
    }

    this.createAnnotationTooltip(annotation, target);
  }

  private onMouseLeave(event: Event): void {
    event.stopPropagation();
    this.clearTooltip();
  }

  private createAnnotation(): Annotation {
    const annotation = new Annotation();
    const sel = window.getSelection();
    
    if (!sel || sel.isCollapsed) {
      throw new Error('NG_ANNOTATE_TEXT_NO_TEXT_SELECTED');
    }

    const range = sel.getRangeAt(0);

    if (range.startContainer !== range.endContainer) {
      throw new Error('NG_ANNOTATE_TEXT_PARTIAL_NODE_SELECTED');
    }

    let parentId: number | undefined;
    let annotationParentCollection: Annotation[];

    if (range.startContainer.parentNode && (range.startContainer.parentNode as HTMLElement).tagName === 'SPAN') {
      // Is a child annotation
      const parentElement = range.startContainer.parentNode as HTMLElement;
      const attrId = parentElement.getAttribute('data-annotation-id');
      parentId = attrId !== null ? parseInt(attrId, 10) : undefined;
      
      if (parentId === undefined) {
        throw new Error('NG_ANNOTATE_TEXT_ILLEGAL_SELECTION');
      }
      
      const parentAnnotation = getAnnotationById(this.annotations, parentId);
      if (!parentAnnotation) {
        throw new Error('NG_ANNOTATE_TEXT_PARENT_NOT_FOUND');
      }
      
      annotationParentCollection = parentAnnotation.children;
    } else {
      annotationParentCollection = this.annotations;
    }

    // Check if this selection has any siblings
    if (annotationParentCollection.length) {
      // Yup, find the previous sibling
      const prevSiblingSpan = range.startContainer.previousSibling as HTMLElement;
      if (prevSiblingSpan) {
        const prevSiblingAttrId = prevSiblingSpan.getAttribute('data-annotation-id');
        const prevSiblingId = prevSiblingAttrId !== null ? parseInt(prevSiblingAttrId, 10) : null;
        
        if (prevSiblingId === null) {
          throw new Error('NG_ANNOTATE_TEXT_ILLEGAL_SELECTION');
        }

        const prevAnnotation = getAnnotationById(this.annotations, prevSiblingId);
        if (!prevAnnotation) {
          throw new Error('NG_ANNOTATE_TEXT_SIBLING_NOT_FOUND');
        }
        
        annotation.startIndex = prevAnnotation.endIndex! + range.startOffset;
        annotation.endIndex = prevAnnotation.endIndex! + range.endOffset;
      } else {
        // Doesn't have a prev sibling
        annotation.startIndex = range.startOffset;
        annotation.endIndex = range.endOffset;
      }
    } else {
      // No siblings
      annotation.startIndex = range.startOffset;
      annotation.endIndex = range.endOffset;
    }

    annotationParentCollection.push(annotation);
    this.clearSelection();
    return annotation;
  }

  private clearSelection(): void {
    const selection = window.getSelection();
    if (!selection) return;
    
    if (selection.empty) { // Chrome
      selection.empty();
    } else if (selection.removeAllRanges) { // Firefox
      selection.removeAllRanges();
    }
  }

  private createAnnotationPopup(annotation: Annotation, anchor: HTMLElement, isNew: boolean): void {
    if (!this.popupComponentType) return;

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.popupComponentType);
    const componentRef = this.viewContainerRef.createComponent<PopupComponentInstance>(
      componentFactory, 
      undefined, 
      this.injector
    );
    
    const instance = componentRef.instance;
    instance.annotation = annotation;
    instance.isNew = isNew;
    instance.readonly = this.readonly;
    instance.anchor = anchor;
    instance.offset = this.popupOffset;
    
    instance.close = () => {
      this.annotate.emit(annotation);
      this.clearPopup();
    };

    instance.reject = () => {
      removeAnnotation(annotation.id, this.annotations);
      this.annotateDelete.emit(annotation);
      this.clearPopup();
    };

    this.activePopup = componentRef;
    this.cdr.detectChanges();
  }

  private createAnnotationTooltip(annotation: Annotation, anchor: HTMLElement): void {
    if (!this.tooltipComponentType) return;

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.tooltipComponentType);
    const componentRef = this.viewContainerRef.createComponent<TooltipComponentInstance>(
      componentFactory, 
      undefined, 
      this.injector
    );
    
    const instance = componentRef.instance;
    instance.annotation = annotation;
    instance.anchor = anchor;
    instance.offset = this.popupOffset;
    
    this.activeTooltip = componentRef;
    this.cdr.detectChanges();
  }

  private clearPopup(): void {
    if (!this.activePopup) return;
    
    this.activePopup.destroy();
    this.activePopup = null;
  }

  private clearTooltip(): void {
    if (!this.activeTooltip) return;
    
    this.activeTooltip.destroy();
    this.activeTooltip = null;
  }

  private clearPopups(): void {
    this.clearPopup();
    this.clearTooltip();
  }
} 