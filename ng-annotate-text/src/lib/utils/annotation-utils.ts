import { Annotation } from '../models/annotation.model';

/**
 * Insert a string at a specific index in the text
 */
export function insertAt(text: string, index: number, string: string): string {
  return text.substr(0, index) + string + text.substr(index);
}

/**
 * Sort annotations by their end index
 */
export function sortAnnotationsByEndIndex(annotations: Annotation[]): Annotation[] {
  return [...annotations].sort((a, b) => {
    if (a.endIndex! < b.endIndex!) {
      return -1;
    } else if (a.endIndex! > b.endIndex!) {
      return 1;
    }
    return 0;
  });
}

/**
 * Convert annotations to HTML with proper spans for highlighting
 */
export function parseAnnotations(text: string, annotations: Annotation[] = [], indexOffset: number = 0): string {
  if (annotations.length === 0) {
    return text;
  }

  annotations = sortAnnotationsByEndIndex(annotations);

  for (let i = annotations.length - 1; i >= 0; i--) {
    const annotation = annotations[i];
    text = insertAt(text, annotation.endIndex! + indexOffset, '</span>');
    
    if (annotation.children.length) {
      text = parseAnnotations(text, annotation.children, annotation.startIndex! + indexOffset);
    }
    
    text = insertAt(
      text, 
      annotation.startIndex! + indexOffset, 
      `<span class="ng-annotate-text-annotation ng-annotate-text-${annotation.id} ng-annotate-text-type-${annotation.type}" data-annotation-id="${annotation.id}">`
    );
  }
  
  return text;
}

/**
 * Find an annotation by its ID
 */
export function getAnnotationById(annotations: Annotation[], aId: number): Annotation | undefined {
  for (const a of annotations) {
    if (aId === a.id) {
      return a;
    }
    if (a.children.length > 0) {
      const an = getAnnotationById(a.children, aId);
      if (an !== undefined) {
        return an;
      }
    }
  }
  return undefined;
}

/**
 * Remove annotation children recursively
 */
export function removeChildren(annotation: Annotation): void {
  for (let i = annotation.children.length - 1; i >= 0; i--) {
    const a = annotation.children[i];
    removeChildren(a);
    a.children.splice(i, 1);
  }
}

/**
 * Remove an annotation by id from the annotations collection
 */
export function removeAnnotation(id: number, annotations: Annotation[]): void {
  for (let i = 0; i < annotations.length; i++) {
    const a = annotations[i];
    removeAnnotation(id, a.children);

    if (a.id === id) {
      removeChildren(a);
      annotations.splice(i, 1);
      return;
    }
  }
} 