import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Course} from '../model/course';
import {
  debounceTime,
  distinctUntilChanged,
  first,
  map,
  startWith,
  switchMap,
  take,
  tap,
  throttleTime,
  withLatestFrom
} from 'rxjs/operators';
import {concat, forkJoin, fromEvent, Observable} from 'rxjs';
import {Lesson} from '../model/lesson';
import {createHttpObservable} from '../common/util';
import {Store} from '../common/store.service';
import {debug, RxJsLoggingLevel, setRxJsLoggingLevel} from '../common/debug';


@Component({
  selector: 'course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css']
})
export class CourseComponent implements OnInit, AfterViewInit {

  courseId: number;

  course$: Observable<Course>;

  lessons$: Observable<Lesson[]>;


  @ViewChild('searchInput', {static: true}) input: ElementRef;

  constructor(private route: ActivatedRoute, private store: Store) {


  }

  ngOnInit() {

    this.courseId = this.route.snapshot.params['id'];

    // this.loadCourse();
    // this.loadCourseWithForkJoin();
    this.loadCourseWithTheWithLatestFromMethod();

  }

  public loadCourse() {
    this.course$ = this.store.selectCourseById(this.courseId);
  }

  public loadCourseWithForkJoin() {

    // fara functia first nu intra in forkJoin pentru ca forkJoin asteapta sa faca complete la Observable
    // functia take poate sa ia si al doilea emit
    this.course$ = this.store.selectCourseById(this.courseId).pipe(
      first(),
      // take(1)
    );

    const lessons$ = this.loadLessons();

    // chestia asta nu prea a mers
    forkJoin(this.course$, lessons$)
      .pipe(
        tap(([course, lessons]) => {
          console.log('courses');
          console.log(course);
          console.log('lessons');
          console.log(lessons);
        })
      )
      .subscribe();
  }

  public loadCourseWithTheWithLatestFromMethod() {

    this.course$ = this.store.selectCourseById(this.courseId);

    const lessons$ = this.loadLessons();

    lessons$
      .pipe(
        withLatestFrom(this.course$)
      )
      .subscribe(([lessons, course]) => {
        console.log('lessons');
        console.log(lessons);
        console.log('lessons');
        console.log(course);
      });
  }

  ngAfterViewInit() {

    // this.searchLessons();
    // this.searchLessonsWithStartWith();
    // this.searchLessonsWithThrottleTime();
    this.searchLessonsWithDebug();

  }

  private searchLessons() {
    // debounceTime ajuta la emiterea unei valori doar can au trecut un interval de timp
    // toate celelante valori care se emit intre timp nu sunt apelate
    // switchMap face cancel la requestul de pe server daca se adauga mai multe requesturi inaite sa se finalizeze cel din nainte
    const searchLessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
      .pipe(
        map(event => event.target.value),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(search => this.loadLessons(search))
      );

    const initialLessons$ = this.loadLessons();

    // concat adauga Observabelurile in momentul in care sunt emise
    this.lessons$ = concat(initialLessons$, searchLessons$);
  }

  private searchLessonsWithStartWith() {

    // E practic acelasi cod ca in searchLessons doar ca in laoc sa concatenez cele doua Observebaluri am folosit startWith
    // operatorul tap este un operator care face debugghing
    this.lessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
      .pipe(
        map(event => event.target.value),
        startWith(''),
        tap(query => console.log(query)),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(search => this.loadLessons(search))
      );

  }

  private searchLessonsWithThrottleTime() {

    // throttleTime permite sa ai un timp de asteptare intre callurile de pe server si permite ca ultima valoare sa fie apelata
    this.lessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
      .pipe(
        map(event => event.target.value),
        throttleTime(400),
      );

  }

  loadLessons(search = ''): Observable<Lesson[]> {
    return createHttpObservable(
      `/api/lessons?courseId=${this.courseId}&pageSize=100&filter=${search}`)
      .pipe(
        map(res => res['payload'])
      );
  }

  private searchLessonsWithDebug() {
    setRxJsLoggingLevel(RxJsLoggingLevel.TRACE);

    // debug inlocuieste operatorul tap si face debugging
    this.lessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
      .pipe(
        map(event => event.target.value),
        startWith(''),
        debug(RxJsLoggingLevel.TRACE, 'search'),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(search => this.loadLessons(search))
      );

  }


}











