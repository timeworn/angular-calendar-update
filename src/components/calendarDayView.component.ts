import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';
import {getDayView, getDayViewHourGrid, CalendarEvent, DayView, DayViewHour} from 'calendar-utils';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {DEFAULT_LOCALE} from './../constants';

const SEGMENT_HEIGHT: number = 30;

@Component({
  selector: 'mwl-calendar-day-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cal-day-view">
      <div
        class="cal-all-day-event"
        *ngFor="let event of view.allDayEvents; trackBy:event"
        [style.backgroundColor]="event.color.secondary"
        [style.borderColor]="event.color.primary">
        <mwl-calendar-event-title
          [event]="event"
          view="day"
          (titleClicked)="eventClicked.emit({event: event})">
        </mwl-calendar-event-title>
        <mwl-calendar-event-actions [event]="event"></mwl-calendar-event-actions>
      </div>
      <div class="cal-hour-rows">
        <div class="cal-hour-col-time">
          <div class="cal-hour" *ngFor="let hour of hours; trackBy:trackByItem">
            <div
              class="cal-hour-segment"
              *ngFor="let segment of hour.segments; trackBy:trackByItem"
              (click)="hourSegmentClicked.emit({date: segment.date.toDate()})"
              [ngClass]="segment.cssClass">
              <div *ngIf="segment.isStart" class="cal-time">
                {{ segment.date | calendarDate:'dayViewHour':locale }}
              </div>
              &nbsp;
            </div>
          </div>
        </div>
        <div class="cal-hour-col-events">
          <div
            class="cal-event"
            *ngFor="let dayEvent of view?.events; trackBy:trackByItem"
            [style.marginTop.px]="dayEvent.top"
            [style.marginLeft.px]="dayEvent.left"
            [style.height.px]="dayEvent.height"
            [style.width.px]="dayEvent.width - 1"
            [style.backgroundColor]="dayEvent.event.color.secondary"
            [style.borderColor]="dayEvent.event.color.primary"
            [class.cal-starts-within-day]="!dayEvent.startsBeforeDay"
            [class.cal-ends-within-day]="!dayEvent.endsAfterDay"
            [ngClass]="dayEvent.event.cssClass">
            <mwl-calendar-event-title
              [event]="dayEvent.event"
              view="day"
              (titleClicked)="eventClicked.emit({event: dayEvent.event})">
            </mwl-calendar-event-title>
            <mwl-calendar-event-actions [event]="dayEvent.event"></mwl-calendar-event-actions>
          </div>
          <div>
            <div class="cal-hour" *ngFor="let hour of hours; trackBy:trackByItem" [style.minWidth.px]="view?.width">
              <div class="cal-hour-segment" *ngFor="let segment of hour.segments; trackBy:trackByItem">
                &nbsp;
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CalendarDayView implements OnChanges {

  /**
   * The current view date
   */
  @Input() date: Date;

  /**
   * An array of events to display on view
   */
  @Input() events: CalendarEvent[] = [];

  /**
   * The number of segments in an hour. Must be <= 6
   */
  @Input() hourSegments: number = 2;

  /**
   * The day start hours in 24 hour time. Must be 0-23
   */
  @Input() dayStartHour: number = 0;

  /**
   * The day start minutes. Must be 0-59
   */
  @Input() dayStartMinute: number = 0;

  /**
   * The day end hours in 24 hour time. Must be 0-23
   */
  @Input() dayEndHour: number = 23;

  /**
   * The day end minutes. Must be 0-59
   */
  @Input() dayEndMinute: number = 59;

  /**
   * The width in pixels of each event on the view
   */
  @Input() eventWidth: number = 150;

  /**
   * An observable that when emitted on will re-render the current view
   */
  @Input() refresh: Subject<any>;

  /**
   * The locale used to format dates
   */
  @Input() locale: string = DEFAULT_LOCALE;

  /**
   * A function that will be called before each hour segment is called. The first argument will contain the hour segment.
   * If you add the `cssClass` property to the segment it will add that class to the hour segment in the template
   */
  @Input() hourSegmentModifier: Function;

  /**
   * Called when an event title is clicked
   */
  @Output() eventClicked: EventEmitter<{event: CalendarEvent}> = new EventEmitter<{event: CalendarEvent}>();

  /**
   * Called when an hour segment is clicked
   */
  @Output() hourSegmentClicked: EventEmitter<{date: Date}> = new EventEmitter<{date: Date}>();

  hours: DayViewHour[] = [];
  view: DayView;
  width: number = 0;
  refreshSubscription: Subscription;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.refresh) {
      this.refreshSubscription = this.refresh.subscribe(() => {
        this.refreshAll();
        this.cdr.markForCheck();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: any): void {

    if (
      changes.date ||
      changes.dayStartHour ||
      changes.dayStartMinute ||
      changes.dayEndHour ||
      changes.dayEndMinute
    ) {
      this.refreshHourGrid();
    }

    if (
      changes.date ||
      changes.events ||
      changes.dayStartHour ||
      changes.dayStartMinute ||
      changes.dayEndHour ||
      changes.dayEndMinute ||
      changes.eventWidth
    ) {
      this.refreshView();
    }

  }

  private trackByItem(index: number, obj: any): any {
    return obj;
  }

  private refreshHourGrid(): void {
    this.hours = getDayViewHourGrid({
      viewDate: this.date,
      hourSegments: this.hourSegments,
      dayStart: {
        hour: this.dayStartHour,
        minute: this.dayStartMinute
      },
      dayEnd: {
        hour: this.dayEndHour,
        minute: this.dayEndMinute
      }
    });
    if (this.hourSegmentModifier) {
      this.hours.forEach(hour => {
        hour.segments = hour.segments.map(segment => this.hourSegmentModifier(segment));
      });
    }
  }

  private refreshView(): void {
    this.view = getDayView({
      events: this.events,
      viewDate: this.date,
      hourSegments: this.hourSegments,
      dayStart: {
        hour: this.dayStartHour,
        minute: this.dayStartMinute
      },
      dayEnd: {
        hour: this.dayEndHour,
        minute: this.dayEndMinute
      },
      eventWidth: this.eventWidth,
      segmentHeight: SEGMENT_HEIGHT
    });
  }

  private refreshAll(): void {
    this.refreshHourGrid();
    this.refreshView();
  }

}
