import {
  Component,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  LOCALE_ID,
  Inject,
  TemplateRef
} from '@angular/core';
import {
  CalendarEvent,
  WeekDay,
  MonthView,
  MonthViewDay,
  ViewPeriod
} from 'calendar-utils';
import { Subject, Subscription } from 'rxjs';
import {
  CalendarEventTimesChangedEvent,
  CalendarEventTimesChangedEventType
} from '../common/calendar-event-times-changed-event.interface';
import { CalendarUtils } from '../common/calendar-utils.provider';
import { validateEvents, trackByIndex } from '../common/util';
import { DateAdapter } from '../../date-adapters/date-adapter';
import { PlacementArray } from 'positioning';

export interface CalendarMonthViewBeforeRenderEvent {
  header: WeekDay[];
  body: MonthViewDay[];
  period: ViewPeriod;
}

export interface CalendarMonthViewEventTimesChangedEvent<
  EventMetaType = any,
  DayMetaType = any
> extends CalendarEventTimesChangedEvent<EventMetaType> {
  day: MonthViewDay<DayMetaType>;
}

/**
 * Shows all events on a given month. Example usage:
 *
 * ```typescript
 * <mwl-calendar-month-view
 *  [viewDate]="viewDate"
 *  [events]="events">
 * </mwl-calendar-month-view>
 * ```
 */
@Component({
  selector: 'mwl-calendar-month-view',
  template: `
    <div class="cal-month-view">
      <mwl-calendar-month-view-header
        [days]="columnHeaders"
        [locale]="locale"
        [customTemplate]="headerTemplate">
      </mwl-calendar-month-view-header>
      <div class="cal-days">
        <div *ngFor="let rowIndex of view.rowOffsets; trackByIndex">
          <div class="cal-cell-row">
            <mwl-calendar-month-cell
              *ngFor="let day of (view.days | slice : rowIndex : rowIndex + (view.totalDaysVisibleInWeek)); trackBy:trackByDate"
              [ngClass]="day?.cssClass"
              [day]="day"
              [openDay]="openDay"
              [locale]="locale"
              [tooltipPlacement]="tooltipPlacement"
              [tooltipAppendToBody]="tooltipAppendToBody"
              [tooltipTemplate]="tooltipTemplate"
              [customTemplate]="cellTemplate"
              (mwlClick)="dayClicked.emit({ day: day })"
              (highlightDay)="toggleDayHighlight($event.event, true)"
              (unhighlightDay)="toggleDayHighlight($event.event, false)"
              mwlDroppable
              dragOverClass="cal-drag-over"
              (drop)="eventDropped(day, $event.dropData.event)"
              (eventClicked)="eventClicked.emit({event: $event.event})">
            </mwl-calendar-month-cell>
          </div>
          <mwl-calendar-open-day-events
            [isOpen]="openRowIndex === rowIndex"
            [events]="openDay?.events"
            [customTemplate]="openDayEventsTemplate"
            [eventTitleTemplate]="eventTitleTemplate"
            (eventClicked)="eventClicked.emit({event: $event.event})"
            mwlDroppable
            dragOverClass="cal-drag-over"
            (drop)="eventDropped(openDay, $event.dropData.event)">
          </mwl-calendar-open-day-events>
        </div>
      </div>
    </div>
  `
})
export class CalendarMonthViewComponent
  implements OnChanges, OnInit, OnDestroy {
  /**
   * The current view date
   */
  @Input()
  viewDate: Date;

  /**
   * An array of events to display on view.
   * The schema is available here: https://github.com/mattlewis92/calendar-utils/blob/c51689985f59a271940e30bc4e2c4e1fee3fcb5c/src/calendarUtils.ts#L49-L63
   */
  @Input()
  events: CalendarEvent[] = [];

  /**
   * An array of day indexes (0 = sunday, 1 = monday etc) that will be hidden on the view
   */
  @Input()
  excludeDays: number[] = [];

  /**
   * Whether the events list for the day of the `viewDate` option is visible or not
   */
  @Input()
  activeDayIsOpen: boolean = false;

  /**
   * An observable that when emitted on will re-render the current view
   */
  @Input()
  refresh: Subject<any>;

  /**
   * The locale used to format dates
   */
  @Input()
  locale: string;

  /**
   * The placement of the event tooltip
   */
  @Input()
  tooltipPlacement: PlacementArray = 'auto';

  /**
   * A custom template to use for the event tooltips
   */
  @Input()
  tooltipTemplate: TemplateRef<any>;

  /**
   * Whether to append tooltips to the body or next to the trigger element
   */
  @Input()
  tooltipAppendToBody: boolean = true;

  /**
   * The start number of the week
   */
  @Input()
  weekStartsOn: number;

  /**
   * A custom template to use to replace the header
   */
  @Input()
  headerTemplate: TemplateRef<any>;

  /**
   * A custom template to use to replace the day cell
   */
  @Input()
  cellTemplate: TemplateRef<any>;

  /**
   * A custom template to use for the slide down box of events for the active day
   */
  @Input()
  openDayEventsTemplate: TemplateRef<any>;

  /**
   * A custom template to use for event titles
   */
  @Input()
  eventTitleTemplate: TemplateRef<any>;

  /**
   * An array of day indexes (0 = sunday, 1 = monday etc) that indicate which days are weekends
   */
  @Input()
  weekendDays: number[];

  /**
   * An output that will be called before the view is rendered for the current month.
   * If you add the `cssClass` property to a day in the body it will add that class to the cell element in the template
   */
  @Output()
  beforeViewRender = new EventEmitter<CalendarMonthViewBeforeRenderEvent>();

  /**
   * Called when the day cell is clicked
   */
  @Output()
  dayClicked = new EventEmitter<{
    day: MonthViewDay;
  }>();

  /**
   * Called when the event title is clicked
   */
  @Output()
  eventClicked = new EventEmitter<{
    event: CalendarEvent;
  }>();

  /**
   * Called when an event is dragged and dropped
   */
  @Output()
  eventTimesChanged = new EventEmitter<
    CalendarMonthViewEventTimesChangedEvent
  >();

  /**
   * @hidden
   */
  columnHeaders: WeekDay[];

  /**
   * @hidden
   */
  view: MonthView;

  /**
   * @hidden
   */
  openRowIndex: number;

  /**
   * @hidden
   */
  openDay: MonthViewDay;

  /**
   * @hidden
   */
  refreshSubscription: Subscription;

  /**
   * @hidden
   */
  trackByIndex = trackByIndex;

  /**
   * @hidden
   */
  trackByDate = (index: number, day: MonthViewDay) => day.date.toISOString();

  /**
   * @hidden
   */
  constructor(
    private cdr: ChangeDetectorRef,
    private utils: CalendarUtils,
    @Inject(LOCALE_ID) locale: string,
    private dateAdapter: DateAdapter
  ) {
    this.locale = locale;
  }

  /**
   * @hidden
   */
  ngOnInit(): void {
    if (this.refresh) {
      this.refreshSubscription = this.refresh.subscribe(() => {
        this.refreshAll();
        this.cdr.markForCheck();
      });
    }
  }

  /**
   * @hidden
   */
  ngOnChanges(changes: any): void {
    if (changes.viewDate || changes.excludeDays || changes.weekendDays) {
      this.refreshHeader();
    }

    if (changes.events) {
      validateEvents(this.events);
    }

    if (
      changes.viewDate ||
      changes.events ||
      changes.excludeDays ||
      changes.weekendDays
    ) {
      this.refreshBody();
    }

    if (
      changes.activeDayIsOpen ||
      changes.viewDate ||
      changes.events ||
      changes.excludeDays
    ) {
      this.checkActiveDayIsOpen();
    }
  }

  /**
   * @hidden
   */
  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  /**
   * @hidden
   */
  toggleDayHighlight(event: CalendarEvent, isHighlighted: boolean): void {
    this.view.days.forEach(day => {
      if (isHighlighted && day.events.indexOf(event) > -1) {
        day.backgroundColor =
          (event.color && event.color.secondary) || '#D1E8FF';
      } else {
        delete day.backgroundColor;
      }
    });
  }

  /**
   * @hidden
   */
  eventDropped(day: MonthViewDay, event: CalendarEvent): void {
    const year: number = this.dateAdapter.getYear(day.date);
    const month: number = this.dateAdapter.getMonth(day.date);
    const date: number = this.dateAdapter.getDate(day.date);
    const newStart: Date = this.dateAdapter.setDate(
      this.dateAdapter.setMonth(
        this.dateAdapter.setYear(event.start, year),
        month
      ),
      date
    );
    let newEnd: Date;
    if (event.end) {
      const secondsDiff: number = this.dateAdapter.differenceInSeconds(
        newStart,
        event.start
      );
      newEnd = this.dateAdapter.addSeconds(event.end, secondsDiff);
    }
    this.eventTimesChanged.emit({
      event,
      newStart,
      newEnd,
      day,
      type: CalendarEventTimesChangedEventType.Drop
    });
  }

  private refreshHeader(): void {
    this.columnHeaders = this.utils.getWeekViewHeader({
      viewDate: this.viewDate,
      weekStartsOn: this.weekStartsOn,
      excluded: this.excludeDays,
      weekendDays: this.weekendDays
    });
    this.emitBeforeViewRender();
  }

  private refreshBody(): void {
    this.view = this.utils.getMonthView({
      events: this.events,
      viewDate: this.viewDate,
      weekStartsOn: this.weekStartsOn,
      excluded: this.excludeDays,
      weekendDays: this.weekendDays
    });
    this.emitBeforeViewRender();
  }

  private checkActiveDayIsOpen(): void {
    if (this.activeDayIsOpen === true) {
      this.openDay = this.view.days.find(day =>
        this.dateAdapter.isSameDay(day.date, this.viewDate)
      );
      const index: number = this.view.days.indexOf(this.openDay);
      this.openRowIndex =
        Math.floor(index / this.view.totalDaysVisibleInWeek) *
        this.view.totalDaysVisibleInWeek;
    } else {
      this.openRowIndex = null;
      this.openDay = null;
    }
  }

  private refreshAll(): void {
    this.columnHeaders = null;
    this.view = null;
    this.refreshHeader();
    this.refreshBody();
    this.checkActiveDayIsOpen();
  }

  private emitBeforeViewRender(): void {
    if (this.columnHeaders && this.view) {
      this.beforeViewRender.emit({
        header: this.columnHeaders,
        body: this.view.days,
        period: this.view.period
      });
    }
  }
}
