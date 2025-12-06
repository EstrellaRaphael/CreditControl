import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="animate-pulse" [ngClass]="containerClass">
      <!-- Card Skeleton -->
      <ng-container *ngIf="type === 'card'">
        <div class="bg-gray-200 rounded-2xl h-[220px]"></div>
      </ng-container>

      <!-- Row Skeleton -->
      <ng-container *ngIf="type === 'row'">
        <div class="bg-white rounded-xl border border-gray-100 p-4">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div class="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </ng-container>

      <!-- Chart Skeleton -->
      <ng-container *ngIf="type === 'chart'">
        <div class="bg-white rounded-2xl border border-gray-200 p-6 h-[420px]">
          <div class="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div class="flex-1 flex items-end justify-around gap-4 h-[320px]">
            <div class="w-12 bg-gray-200 rounded-t" style="height: 60%"></div>
            <div class="w-12 bg-gray-200 rounded-t" style="height: 80%"></div>
            <div class="w-12 bg-gray-200 rounded-t" style="height: 40%"></div>
            <div class="w-12 bg-gray-200 rounded-t" style="height: 70%"></div>
            <div class="w-12 bg-gray-200 rounded-t" style="height: 50%"></div>
            <div class="w-12 bg-gray-200 rounded-t" style="height: 90%"></div>
          </div>
        </div>
      </ng-container>

      <!-- Hero Skeleton -->
      <ng-container *ngIf="type === 'hero'">
        <div class="bg-gray-200 rounded-2xl h-[240px]"></div>
      </ng-container>

      <!-- Stat Skeleton -->
      <ng-container *ngIf="type === 'stat'">
        <div class="bg-white rounded-2xl border border-gray-200 p-6 h-[180px]">
          <div class="space-y-4">
            <div class="flex justify-between">
              <div class="h-4 bg-gray-200 rounded w-1/2"></div>
              <div class="w-10 h-10 bg-gray-200 rounded-lg"></div>
            </div>
            <div class="h-8 bg-gray-200 rounded w-2/3"></div>
            <div class="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </ng-container>

      <!-- Text Line Skeleton -->
      <ng-container *ngIf="type === 'text'">
        <div class="h-4 bg-gray-200 rounded" [ngClass]="widthClass"></div>
      </ng-container>
    </div>
  `
})
export class SkeletonComponent {
    @Input() type: 'card' | 'row' | 'chart' | 'hero' | 'stat' | 'text' = 'row';
    @Input() containerClass = '';
    @Input() widthClass = 'w-full';
}
