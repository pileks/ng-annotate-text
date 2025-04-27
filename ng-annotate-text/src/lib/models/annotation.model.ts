export interface AnnotationData {
  points?: number;
  comment?: string;
  [key: string]: any;
}

export class Annotation {
  private static idCounter = 0;

  id: number;
  startIndex: number | null;
  endIndex: number | null;
  type: string;
  data: AnnotationData;
  children: Annotation[];

  constructor(data?: Partial<Annotation>) {
    this.id = Annotation.idCounter++;
    this.startIndex = null;
    this.endIndex = null;
    this.type = '';
    this.data = { points: 0 };
    this.children = [];

    if (data) {
      Object.assign(this, data);
    }
  }
} 