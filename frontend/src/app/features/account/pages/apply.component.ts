import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApplyPayload, CustomerApplication } from '@core/models/customer-portal.model';
import { PrefillView } from '@core/models/customer-profile.model';
import { AuthService } from '@core/services/auth.service';
import { CustomerPortalService } from '@core/services/customer-portal.service';
import { CustomerProfileService } from '@core/services/customer-profile.service';
import { calculateEmi, formatInr } from '@core/utils/emi';

import { loanSquare } from '../../website/loan-images';
import { PRODUCT_PAGES } from '../../website/product-pages.data';
import { WEBSITE } from '../../website/website.config';
import { acceptFor, typeError } from '../document-rules';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];
const PHONE = /^[0-9+\-\s()]{10,16}$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const EST_RATE = 12.5;

const STEP_LABELS = ['Personal', 'Employment', 'Loan Details', 'Documents', 'Review', 'Complete'];
const STAGES = ['Application Submitted', 'Document Verification', 'Lender Review', 'Decision', 'Completed'];

const DOCS = [
  { type: 'pan', label: 'PAN Card', hint: 'JPG, PNG, PDF (Max 5 MB)', icon: 'badge' },
  { type: 'aadhaar', label: 'Aadhaar Card', hint: 'JPG, PNG, PDF (Max 5 MB)', icon: 'contact_page' },
  { type: 'address_proof', label: 'Address Proof', hint: 'Utility bill, rent agreement (Max 5 MB)', icon: 'home' },
  { type: 'income_proof', label: 'Income Proof', hint: 'Salary slip / ITR · PDF only (Max 5 MB)', icon: 'receipt_long' },
  { type: 'bank_statement', label: 'Bank Statement', hint: 'Last 6 months · PDF only (Max 5 MB)', icon: 'account_balance' },
] as const;

const PURPOSES = ['Home Renovation', 'Medical Expenses', 'Education', 'Wedding', 'Travel', 'Debt Consolidation', 'Business Expansion', 'Vehicle Purchase', 'Other'];
const EMPLOYMENT = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'business', label: 'Business Owner' },
  { value: 'professional', label: 'Professional' },
];
const TENURES = [6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 72, 84, 120];
const CITIES = ['Nagpur', 'Mumbai', 'Pune', 'Nashik', 'Aurangabad', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Other'];

type Doc = (typeof DOCS)[number];

/** Must be at least 18 on the day of applying. */
function adult(c: AbstractControl): ValidationErrors | null {
  const v = c.value as string;
  if (!v) return null;
  const born = new Date(v);
  if (Number.isNaN(born.getTime())) return { dob: true };
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return born <= limit && born.getFullYear() > 1900 ? null : { underage: true };
}

/** crypto.randomUUID needs a secure context; fall back for plain-http hosts. */
function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Apply for a loan — the step flow from images/12_Dashboard/03_Apply_Flow/02_Flow_Overview.png. */
@Component({
  selector: 'app-account-apply',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (prefilled() && step() > 1 && step() < 7) {
      <div class="prefill" role="status"><span class="material-icons">auto_fix_high</span><div><b>We filled in your details</b><small>They come from your profile{{ hadApplication() ? ' and your last application' : '' }}. Please check them and change anything that is out of date.</small></div><button type="button" class="prefill__x" (click)="prefilled.set(false)" aria-label="Hide this message"><span class="material-icons">close</span></button></div>
    }

    @if (step() > 1 && step() < 7) {
      <ol class="prog" aria-label="Application steps">
        @for (l of stepLabels; track l; let i = $index) {
          <li [class.passed]="i + 2 < step()" [class.now]="i + 2 === step()"><span class="pd">@if (i + 2 < step()) { <span class="material-icons">check</span> } @else { {{ i + 1 }} }</span><b>{{ l }}</b></li>
        }
      </ol>
    }

    @switch (step()) {
      <!-- ───────────── 1 · Select loan & start ───────────── -->
      @case (1) {
        <div class="s1">
          <div class="left">
          <section class="hero">
            <div class="hero__txt">
              <h1>{{ current().name }}</h1>
              <p>{{ current().tagline }}</p>
              <ul class="chips">
                <li><span class="material-icons">percent</span>Competitive <br />Interest Rates</li>
                <li><span class="material-icons">tune</span>Flexible <br />Tenure</li>
                <li><span class="material-icons">bolt</span>Quick <br />Approval</li>
                <li><span class="material-icons">description</span>Minimal <br />Documentation</li>
              </ul>
            </div>
            @if (art(); as src) { <img [src]="src" alt="" width="120" height="120" /> }
          </section>

          <!-- Desktop / tablet: fills the space under the hero with what the chosen loan offers. Hidden on phones to keep that screen short. -->
          <div class="extra">
            <ul class="facts4" aria-label="Loan at a glance">
              @for (f of current().strip; track f.label) { <li><small>{{ f.label }}</small><b>{{ f.value }}</b></li> }
            </ul>
            <section class="panel pad">
              <h2 class="eh">{{ current().how.title }}</h2>
              <ol class="how">
                @for (st of current().how.steps; track st.title; let i = $index) { <li><i>{{ i + 1 }}</i><b>{{ st.title }}</b><small>{{ st.text }}</small></li> }
              </ol>
            </section>
            <section class="panel pad why">
              <ul class="why__list">
                @for (w of reasons; track w.title) { <li><span class="material-icons" aria-hidden="true">{{ w.icon }}</span><span><b>{{ w.title }}</b><small>{{ w.text }}</small></span></li> }
              </ul>
                          </section>
          </div>
          </div>

          <section class="panel pad calc">
            <div class="pick">
              <span class="pick__lbl" id="loan-type-l">Loan type</span>
              <div class="pick__m">
                <button type="button" class="pick__btn" [class.open]="menu()" (click)="menu.set(!menu())" (keydown.arrowdown)="menu.set(true); $event.preventDefault()" [attr.aria-expanded]="menu()" aria-haspopup="listbox" aria-labelledby="loan-type-l">
                  <span class="material-icons pick__ic" aria-hidden="true">{{ current().icon }}</span><span class="pick__v">{{ current().name }}</span><span class="material-icons pick__chev" aria-hidden="true">expand_more</span>
                </button>
                @if (menu()) {
                  <ul class="pick__list" role="listbox" aria-labelledby="loan-type-l">
                    @for (p of products; track p.slug; let i = $index) {
                      <li role="option" [attr.aria-selected]="p.slug === product()" [class.on]="p.slug === product()" tabindex="0" [style.animation-delay.ms]="i * 18" (click)="choose(p.slug)" (keydown.enter)="choose(p.slug)" (keydown.space)="choose(p.slug); $event.preventDefault()" (keydown.arrowdown)="focusSibling($event, 'nextElementSibling')" (keydown.arrowup)="focusSibling($event, 'previousElementSibling')">
                        <span class="material-icons" aria-hidden="true">{{ p.icon }}</span>{{ p.name }}@if (p.slug === product()) { <span class="material-icons pick__tick" aria-hidden="true">check</span> }
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
            <div class="slider">
              <label for="amt">Select Loan Amount</label><b>{{ fmt(amount()) }}</b>
              <input id="amt" class="rng" type="range" min="50000" max="5000000" step="10000" [value]="amount()" (input)="amount.set(+$any($event.target).value)" aria-label="Loan amount" />
              <div class="ends"><span>₹50,000</span><span>₹50,00,000</span></div>
            </div>
            <div class="slider">
              <label for="ten">Select Tenure</label><b>{{ months() }} Months</b>
              <input id="ten" class="rng" type="range" min="6" max="60" step="1" [value]="months()" (input)="months.set(+$any($event.target).value)" aria-label="Tenure in months" />
              <div class="ends"><span>6 Months</span><span>60 Months</span></div>
            </div>
            <div class="slider">
              <label for="rt">Interest Rate (p.a.)</label><b>{{ rate() }}%</b>
              <input id="rt" class="rng" type="range" min="7" max="30" step="0.5" [value]="rate()" (input)="rate.set(+$any($event.target).value)" aria-label="Interest rate per year" />
              <div class="ends"><span>7%</span><span>30%</span></div>
            </div>
            <div class="emi"><small>Estimated EMI</small><strong>{{ fmt(emi()) }} / month</strong><em>Indicative, at {{ rate() }}% p.a. The lender decides the final rate.</em></div>
            <button type="button" class="fw-btn fw-btn--primary fw-btn--block" (click)="go(2)">Apply Now <span class="material-icons">arrow_forward</span></button>
          </section>
        </div>
      }

      <!-- ───────────── 2 · Personal ───────────── -->
      @case (2) {
        <section class="panel pad form">
          <h1>Personal Details</h1><p class="sub">Let’s get to know you better.</p>
          <form [formGroup]="personal" (ngSubmit)="next(personal, 3)" novalidate>
            <div class="grid">
              <div class="f"><label for="p-name">Full Name *</label><input id="p-name" class="in" formControlName="name" autocomplete="name" maxlength="150" />
                @if (bad(personal, 'name')) { <small class="err">Enter your full name.</small> }</div>
              <div class="f"><label for="p-email">Email Address *</label><input id="p-email" class="in" type="email" inputmode="email" formControlName="email" autocomplete="email" maxlength="190" />
                @if (bad(personal, 'email')) { <small class="err">Enter a valid email address.</small> }</div>
              <div class="f"><label for="p-dob">Date of Birth *</label><input id="p-dob" class="in" type="date" formControlName="dob" [max]="maxDob" />
                @if (bad(personal, 'dob')) { <small class="err">{{ personal.controls.dob.hasError('underage') ? 'You must be at least 18 years old.' : 'Enter a valid date of birth.' }}</small> }</div>
              <div class="f"><label for="p-gender">Gender *</label><select id="p-gender" class="in" formControlName="gender"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
                @if (bad(personal, 'gender')) { <small class="err">Please select your gender.</small> }</div>
              <div class="f"><label for="p-marital">Marital Status *</label><select id="p-marital" class="in" formControlName="marital"><option value="">Select</option><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option></select>
                @if (bad(personal, 'marital')) { <small class="err">Please select your marital status.</small> }</div>
              <div class="f"><label for="p-phone">Mobile Number *</label><input id="p-phone" class="in" type="tel" inputmode="tel" formControlName="phone" autocomplete="tel" />
                @if (bad(personal, 'phone')) { <small class="err">Enter a valid 10-digit mobile number.</small> }</div>
              <div class="f"><label for="p-pan">PAN Number *</label><input id="p-pan" class="in" formControlName="pan" maxlength="10" autocapitalize="characters" placeholder="ABCDE1234F" (input)="upper($event)" />
                @if (bad(personal, 'pan')) { <small class="err">PAN looks like ABCDE1234F (5 letters, 4 digits, 1 letter).</small> }</div>
              <div class="f"><label for="p-aadhaar">Aadhaar Number *</label><input id="p-aadhaar" class="in" formControlName="aadhaar" inputmode="numeric" maxlength="14" placeholder="1234 5678 9012" (input)="groupAadhaar($event)" />
                @if (bad(personal, 'aadhaar')) { <small class="err">Aadhaar has 12 digits.</small> }
                @if (aadhaarHint()) { <small class="hint">You gave us this before (ending {{ aadhaarHint() }}). Please enter the full number once more.</small> }</div>
            </div>
            <div class="safe"><span class="material-icons">verified_user</span><div><b>Your information is safe with us.</b><small>We use bank-level encryption to protect your data. Only the last 4 digits of your Aadhaar are kept.</small></div></div>
            <div class="nav"><button type="button" class="fw-btn fw-btn--ghost" (click)="go(1)">Back</button><button type="submit" class="fw-btn fw-btn--primary">Save &amp; Continue <span class="material-icons">arrow_forward</span></button></div>
          </form>
        </section>
      }

      <!-- ───────────── 3 · Employment ───────────── -->
      @case (3) {
        <section class="panel pad form">
          <h1>Employment Details</h1><p class="sub">Tell us about your work.</p>
          <form [formGroup]="employment" (ngSubmit)="next(employment, 4)" novalidate>
            <fieldset class="radios"><legend>Employment Type *</legend>
              @for (t of employmentTypes; track t.value) { <label class="radio"><input type="radio" formControlName="type" [value]="t.value" />{{ t.label }}</label> }
              @if (bad(employment, 'type')) { <small class="err">Please choose your employment type.</small> }
            </fieldset>
            <div class="grid">
              <div class="f"><label for="e-company">Company Name *</label><input id="e-company" class="in" formControlName="company" maxlength="150" />
                @if (bad(employment, 'company')) { <small class="err">Enter your company or business name.</small> }</div>
              <div class="f"><label for="e-desig">Designation *</label><input id="e-desig" class="in" formControlName="designation" maxlength="100" />
                @if (bad(employment, 'designation')) { <small class="err">Enter your designation.</small> }</div>
              <div class="f"><label for="e-exp">Work Experience *</label><select id="e-exp" class="in" formControlName="experience"><option value="">Select</option>@for (y of years; track y) { <option [value]="y">{{ y }} {{ y === 1 ? 'Year' : 'Years' }}</option> }</select>
                @if (bad(employment, 'experience')) { <small class="err">Please select your experience.</small> }</div>
              <div class="f"><label for="e-income">Monthly Income (₹) *</label><input id="e-income" class="in" type="number" inputmode="numeric" min="1" formControlName="income" />
                @if (bad(employment, 'income')) { <small class="err">Enter your monthly income.</small> }</div>
              <div class="f"><label for="e-city">City *</label><select id="e-city" class="in" formControlName="city"><option value="">Select city</option>@for (c of cities(); track c) { <option [value]="c">{{ c }}</option> }</select>
                @if (bad(employment, 'city')) { <small class="err">Please select your city.</small> }</div>
              <div class="f f--wide"><label for="e-addr">Office Address *</label><input id="e-addr" class="in" formControlName="address" maxlength="255" />
                @if (bad(employment, 'address')) { <small class="err">Enter your office address.</small> }</div>
            </div>
            <div class="nav"><button type="button" class="fw-btn fw-btn--ghost" (click)="go(2)">Back</button><button type="submit" class="fw-btn fw-btn--primary">Save &amp; Continue <span class="material-icons">arrow_forward</span></button></div>
          </form>
        </section>
      }

      <!-- ───────────── 4 · Loan details ───────────── -->
      @case (4) {
        <section class="panel pad form">
          <h1>Loan Details</h1><p class="sub">Tell us about your requirement.</p>
          <form [formGroup]="loan" (ngSubmit)="next(loan, 5)" novalidate>
            <div class="grid">
              <div class="f"><label for="l-purpose">Loan Purpose *</label><select id="l-purpose" class="in" formControlName="purpose"><option value="">Select purpose</option>@for (p of purposes; track p) { <option [value]="p">{{ p }}</option> }</select>
                @if (bad(loan, 'purpose')) { <small class="err">Please select the loan purpose.</small> }</div>
              <div class="f"><label for="l-amount">Loan Amount (₹) *</label><input id="l-amount" class="in" type="number" inputmode="numeric" formControlName="amount" />
                @if (bad(loan, 'amount')) { <small class="err">Enter an amount between ₹1,000 and ₹100 crore.</small> }</div>
              <div class="f"><label for="l-tenure">Preferred Tenure *</label><select id="l-tenure" class="in" formControlName="tenure">@for (t of tenureOptions(); track t) { <option [value]="t">{{ t }} Months</option> }</select></div>
            </div>
            <fieldset class="radios"><legend>Do you have any existing loans?</legend>
              <label class="radio"><input type="radio" formControlName="existing" [value]="true" />Yes</label>
              <label class="radio"><input type="radio" formControlName="existing" [value]="false" />No</label>
            </fieldset>
            @if (loan.controls.existing.value) {
              <div class="f half"><label for="l-emi">Total monthly EMI of existing loans (₹)</label><input id="l-emi" class="in" type="number" inputmode="numeric" min="0" formControlName="existingEmi" /></div>
            }
            <div class="emi"><small>Estimated EMI</small><strong>{{ fmt(loanEmi()) }} / month</strong><em>Indicative, at {{ rate() }}% p.a. (change it on the first screen). The lender decides the final rate.</em></div>
            <div class="safe safe--blue"><span class="material-icons">redeem</span><div><b>Based on your profile, you may be eligible for special offers and lower interest rates.</b></div></div>
            <div class="nav"><button type="button" class="fw-btn fw-btn--ghost" (click)="go(3)">Back</button><button type="submit" class="fw-btn fw-btn--primary">Save &amp; Continue <span class="material-icons">arrow_forward</span></button></div>
          </form>
        </section>
      }

      <!-- ───────────── 5 · Upload documents ───────────── -->
      @case (5) {
        <section class="panel pad form">
          <h1>Upload Documents</h1><p class="sub">Please upload the required documents. PDF, JPG or PNG, up to 5 MB each.</p>
          @if (docError()) { <div class="fw-alert fw-alert--error" role="alert">{{ docError() }}</div> }
          @for (d of docs; track d.type) {
            <div class="doc" [class.has]="files()[d.type]">
              <span class="doc__ic material-icons">{{ d.icon }}</span>
              <div class="doc__t"><b>{{ d.label }} *</b>
                @if (files()[d.type]; as f) { <small class="ok"><span class="material-icons">check_circle</span>{{ f.name }} · {{ size(f.size) }}</small> } @else { <small>{{ d.hint }}</small> }
              </div>
              @if (files()[d.type]) { <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="removeFile(d)">Remove</button> }
              <label class="fw-btn fw-btn--ghost fw-btn--sm up">{{ files()[d.type] ? 'Replace' : 'Upload' }}<input type="file" [attr.accept]="accept(d.type)" (change)="pickFile(d, $event)" [attr.aria-label]="'Upload ' + d.label" /></label>
            </div>
          }
          @if (docsMissing()) { <small class="err">Please upload all {{ docs.length }} documents to continue.</small> }
          <div class="note"><span class="material-icons">lock</span>All documents are encrypted and stored securely.</div>
          <div class="nav"><button type="button" class="fw-btn fw-btn--ghost" (click)="go(4)">Back</button><button type="button" class="fw-btn fw-btn--primary" (click)="nextDocs()">Save &amp; Continue <span class="material-icons">arrow_forward</span></button></div>
        </section>
      }

      <!-- ───────────── 6 · Review ───────────── -->
      @case (6) {
        <section class="panel pad form">
          <h1>Review Your Application</h1><p class="sub">Please verify your details before submission.</p>
          <div class="rev">
            <div class="rev__h"><span class="material-icons">person</span><b>Personal Details</b><button type="button" class="edit" (click)="go(2)">Edit</button></div>
            <p>{{ personal.controls.name.value }} · {{ personal.controls.phone.value }}<br />{{ personal.controls.email.value }}<br />DOB {{ personal.controls.dob.value | date: 'd MMM y' }} · {{ cap(personal.controls.gender.value) }} · {{ cap(personal.controls.marital.value) }}<br />PAN {{ personal.controls.pan.value }} · Aadhaar XXXX XXXX {{ aadhaarLast4() }}</p>
          </div>
          <div class="rev">
            <div class="rev__h"><span class="material-icons">work</span><b>Employment Details</b><button type="button" class="edit" (click)="go(3)">Edit</button></div>
            <p>{{ employment.controls.company.value }} · {{ employment.controls.designation.value }}<br />{{ employmentLabel() }} · {{ employment.controls.experience.value }} Years · {{ fmt(+(employment.controls.income.value ?? 0)) }}/month<br />{{ employment.controls.address.value }}, {{ employment.controls.city.value }}</p>
          </div>
          <div class="rev">
            <div class="rev__h"><span class="material-icons">payments</span><b>Loan Details</b><button type="button" class="edit" (click)="go(4)">Edit</button></div>
            <p>{{ current().name }} · {{ fmt(+loan.controls.amount.value) }} · {{ loan.controls.tenure.value }} Months<br />Purpose: {{ loan.controls.purpose.value }}<br />Existing loans: {{ loan.controls.existing.value ? 'Yes' + (loan.controls.existingEmi.value ? ' (EMI ' + fmt(+loan.controls.existingEmi.value) + ')' : '') : 'No' }}</p>
          </div>
          <div class="rev">
            <div class="rev__h"><span class="material-icons">folder</span><b>Documents</b><button type="button" class="edit" (click)="go(5)">Edit</button></div>
            <p>{{ docs.length }} documents uploaded: {{ docNames() }}</p>
          </div>
          <label class="agree"><input type="checkbox" [checked]="updateProfile()" (change)="updateProfile.set($any($event.target).checked)" />Save these details to my profile, so I don’t have to enter them again next time.</label>
          <label class="agree"><input type="checkbox" [checked]="consent()" (change)="consent.set($any($event.target).checked)" />I confirm that all the information provided is accurate and true to the best of my knowledge, and I agree to the <a routerLink="/terms" target="_blank">Terms</a> and <a routerLink="/privacy-policy" target="_blank">Privacy Policy</a>.</label>
          @if (consentMissing()) { <small class="err">Please confirm to continue.</small> }
          @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }
          @if (busy()) { <div class="progress" role="status"><span class="spin"></span>{{ progress() }}</div> }
          <div class="nav"><button type="button" class="fw-btn fw-btn--ghost" (click)="go(5)" [disabled]="busy()">Back</button><button type="button" class="fw-btn fw-btn--primary" (click)="submitApplication()" [disabled]="busy()">Submit Application <span class="material-icons">arrow_forward</span></button></div>
        </section>
      }

      <!-- ───────────── 7 · Submitted ───────────── -->
      @case (7) {
        @if (result(); as a) {
          <div class="done">
            <section class="done__main">
              <div class="tick" aria-hidden="true"><span class="material-icons">check</span></div>
              <h1>Application Submitted <span>Successfully!</span></h1>
              <h2>Thank you, {{ first() }}!</h2>
              <p>Your loan application has been submitted and is under review. Our team will verify your details and get back to you soon.</p>
              @if (failedDocs().length) { <div class="fw-alert fw-alert--warn" role="alert">We couldn’t upload: {{ failedDocs().join(', ') }}. Please add {{ failedDocs().length === 1 ? 'it' : 'them' }} from <a routerLink="/account/documents">My Documents</a>.</div> }
              <div class="facts">
                <div><span class="material-icons g">check_circle</span><small>Application ID</small><b>{{ a.reference }}</b></div>
                <div><span class="material-icons">event</span><small>Submitted On</small><b>{{ a.applied_on | date: 'd MMM y, h:mm a' }}</b></div>
                <div><span class="material-icons">description</span><small>Loan Type</small><b>{{ a.loan_type_label }}</b></div>
              </div>
              <ol class="steps" aria-label="Progress">
                @for (s of stages; track s; let i = $index) {
                  <li [class]="'st st--' + (i === 0 ? 'done' : i === 1 ? 'now' : 'todo')"><span class="dot"><span class="material-icons">{{ i === 0 ? 'check' : i === 1 ? 'hourglass_top' : 'schedule' }}</span></span><b>{{ s }}</b><em>{{ i === 0 ? 'Completed' : i === 1 ? 'In Progress' : 'Pending' }}</em></li>
                }
              </ol>
              <div class="keep"><span class="material-icons">mail</span><div><b>We will keep you updated!</b><small>You will receive SMS, email and in-app notifications at every step. You can also track your application status from your dashboard.</small></div></div>
              <div class="cta">
                <a class="fw-btn fw-btn--primary" [routerLink]="['/account/applications', a.id]">Track Application <span class="material-icons">arrow_forward</span></a>
                <a class="fw-btn fw-btn--ghost" routerLink="/account">Back to Dashboard</a>
                <a class="fw-btn fw-btn--ghost wa" [href]="site.whatsappHref" target="_blank" rel="noopener"><span class="material-icons">chat</span>Chat on WhatsApp</a>
              </div>
            </section>
            <aside class="panel pad next">
              <h3>What’s Next?</h3>
              <ol>
                <li><span>1</span><div><b>Document Verification</b><small>We will verify your documents (usually within 1–2 working days).</small></div></li>
                <li><span>2</span><div><b>Lender Review</b><small>Your application will be reviewed with our partner lenders.</small></div></li>
                <li><span>3</span><div><b>Decision</b><small>Once decided, you will receive the outcome and loan details.</small></div></li>
                <li><span>4</span><div><b>Disbursal</b><small>After final verification, the amount is disbursed to your bank account.</small></div></li>
              </ol>
              <div class="q"><b>Have Questions?</b><small>Our loan experts are here to help.</small><a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/help">Talk to an Expert</a></div>
            </aside>
          </div>
          <section class="panel pad more">
            <div class="mh"><h3>Explore More Financial Solutions</h3><a routerLink="/account/apply">View All Services →</a></div>
            <div class="mg">
              @for (p of more; track p.slug) { <a routerLink="/account/apply" [queryParams]="{ product: p.slug }"><span class="material-icons">{{ p.icon }}</span><span><b>{{ p.name }}</b><small>{{ p.cardText }}</small></span></a> }
            </div>
          </section>
        }
      }
    }
  `,
  styles: [
    `
      h1 { margin: 0 0 4px; font-size: clamp(1.5rem, 2.6vw, 2rem); color: var(--fw-navy); } .sub { margin: 0 0 16px; color: var(--fw-muted); font-size: 0.9rem; }
      .panel { background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.04); min-width: 0; } .pad { padding: 22px; }
      .fw-btn { white-space: nowrap; }
      .prefill { display: flex; gap: 12px; align-items: center; max-width: 820px; margin: 0 auto 14px; background: #eefaf2; border: 1px solid #c9ecd5; border-radius: 12px; padding: 10px 14px; } .prefill > .material-icons:first-child { color: #16a34a; } .prefill div { display: grid; flex: 1; line-height: 1.35; } .prefill small { color: var(--fw-muted); font-size: 0.78rem; } .prefill__x { background: none; border: 0; cursor: pointer; color: var(--fw-muted); display: grid; padding: 4px; }
      .hint { color: var(--fw-muted); font-size: 0.74rem; }
      .prog { list-style: none; margin: 0 auto 16px; padding: 0; display: grid; grid-template-columns: repeat(6, 1fr); max-width: 760px; }
      .prog li { position: relative; display: grid; justify-items: center; gap: 4px; font-size: 0.72rem; color: var(--fw-muted); text-align: center; }
      .prog li:not(:last-child)::after { content: ''; position: absolute; top: 13px; left: calc(50% + 15px); right: calc(-50% + 15px); height: 2px; background: #d7dfec; } .prog li.passed:not(:last-child)::after { background: var(--fw-blue); }
      .pd { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: #d7dfec; color: #fff; font-weight: 600; font-size: 0.78rem; position: relative; z-index: 1; } .pd .material-icons { font-size: 16px; }
      .passed .pd { background: var(--fw-blue); } .now .pd { background: #fff; color: var(--fw-blue); border: 3px solid var(--fw-blue); } .now b { color: var(--fw-ink); }
      .left { display: grid; gap: 16px; min-width: 0; align-content: start; } .extra { display: grid; gap: 16px; } .calc { align-self: start; }
      .facts4 { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; } .facts4 li { background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; padding: 12px; display: grid; gap: 3px; } .facts4 small { color: var(--fw-muted); font-size: 0.72rem; } .facts4 b { font-size: 0.84rem; color: var(--fw-navy); line-height: 1.3; }
      .eh { margin: 0 0 12px; font-size: 1.02rem; color: var(--fw-ink); }
      .how { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; } .how li { display: grid; gap: 3px; justify-items: start; } .how i { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--fw-blue); color: #fff; font-style: normal; font-weight: 600; font-size: 0.85rem; margin-bottom: 4px; } .how b { font-size: 0.86rem; } .how small { color: var(--fw-muted); font-size: 0.76rem; }
      .s1 { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(300px, 1fr); gap: 16px; align-items: start; }
      .hero { background: linear-gradient(120deg, #061a3d, #0a2f66 60%, #0d4a9a); color: #fff; border-radius: 16px; padding: 24px; display: flex; justify-content: space-between; gap: 16px; align-items: center; min-height: 260px; }
      .hero__txt { display: grid; gap: 8px; align-content: center; } .hero h1 { color: #fff; font-size: clamp(1.8rem, 3vw, 2.4rem); } .hero p { margin: 0; color: #cfe0ff; }
      .hero img { width: 120px; height: 120px; object-fit: cover; border-radius: 16px; flex: none; border: 3px solid rgba(255, 255, 255, 0.25); }
      .pick { display: grid; gap: 6px; font-size: 0.8rem; color: var(--fw-blue); margin-bottom: 18px; position: relative; } .pick__lbl { font-weight: 500; letter-spacing: 0.2px; opacity: 0.8; } .pick__m { position: relative; }
      .pick__btn { display: flex; align-items: center; gap: 10px; width: 100%; height: 52px; box-sizing: border-box; border: 1.5px solid var(--fw-line); border-radius: 12px; padding: 0 14px; background: #fff; color: var(--fw-ink); font: 500 1rem Poppins, sans-serif; cursor: pointer; text-align: left; box-shadow: 0 4px 14px rgba(16, 33, 58, 0.1); transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s; }
      .pick__btn:hover { box-shadow: 0 4px 14px rgba(6, 26, 61, 0.28); transform: translateY(-1px); } .pick__btn:active { transform: none; } .pick__btn:focus-visible, .pick__btn.open { outline: 0; border-color: #4dc4ff; box-shadow: 0 0 0 3px rgba(77, 196, 255, 0.3); }
      .pick__ic { color: var(--fw-blue); font-size: 20px; } .pick__v { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pick__chev { color: var(--fw-muted); font-size: 22px; transition: transform 0.25s cubic-bezier(0.22, 0.8, 0.24, 1); } .pick__btn.open .pick__chev { transform: rotate(180deg); }
      .pick__list { position: absolute; z-index: 20; left: 0; right: 0; top: calc(100% + 6px); margin: 0; padding: 6px; list-style: none; background: #fff; border-radius: 12px; border: 1px solid var(--fw-line); box-shadow: 0 16px 36px rgba(16, 33, 58, 0.22); max-height: 280px; overflow-y: auto; overscroll-behavior: contain; transform-origin: top; animation: pick-in 0.2s cubic-bezier(0.22, 0.8, 0.24, 1); }
      .pick__list li { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; color: var(--fw-ink); font: 500 0.86rem Poppins, sans-serif; cursor: pointer; opacity: 0; animation: pick-item 0.22s ease forwards; transition: background 0.15s, padding-left 0.15s; }
      .pick__list li .material-icons { font-size: 19px; color: var(--fw-blue); } .pick__list li .pick__tick { margin-left: auto; width: 24px; height: 24px; display: grid; place-items: center; box-sizing: border-box; padding: 0; border-radius: 50%; background: #fff; color: var(--fw-blue); font-size: 16px; animation: tick-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .pick__list li.on .pick__tick { color: var(--fw-blue); }
      @keyframes tick-pop { 0% { transform: scale(0) rotate(-45deg); } 100% { transform: none; } }
      .pick__list li:hover, .pick__list li:focus-visible { background: var(--fw-blue-soft); outline: 0; padding-left: 14px; }
      .pick__list li.on { background: var(--fw-blue); color: #fff; } .pick__list li.on > .material-icons:first-child { color: #fff; }
      .hero h1, .hero p { animation: swap-in 0.3s ease; }
      @keyframes pick-in { from { opacity: 0; transform: translateY(-6px) scaleY(0.94); } to { opacity: 1; transform: none; } }
      @keyframes pick-item { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
      @keyframes swap-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) { .pick__btn, .pick__chev, .pick__list, .pick__list li, .hero h1, .hero p { animation: none; transition: none; opacity: 1; } } .pick select { border-radius: 8px; border: 0; padding: 8px 10px; font: 500 0.86rem Poppins, sans-serif; background: #fff; color: var(--fw-ink); }
      .chips { list-style: none; margin: 8px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; } .chips li { display: grid; justify-items: center; text-align: center; font-size: 0.7rem; gap: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 10px 4px; } .chips .material-icons { color: #4dc4ff; }
      .slider { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; margin-bottom: 18px; } .slider label { color: var(--fw-muted); font-size: 0.86rem; } .slider b { font-size: 1.15rem; color: var(--fw-navy); } .slider .rng, .slider .ends { grid-column: 1 / -1; }
      .ends { display: flex; justify-content: space-between; color: var(--fw-muted); font-size: 0.72rem; }
      .emi { display: grid; gap: 2px; background: var(--fw-blue-soft); border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; } .emi small { color: var(--fw-muted); } .emi strong { font-size: 1.5rem; color: var(--fw-navy); } .emi em { font-style: normal; font-size: 0.72rem; color: var(--fw-muted); }
      .form { max-width: 820px; margin: 0 auto; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; } .f { display: grid; gap: 4px; align-content: start; } .f--wide { grid-column: 1 / -1; } .half { max-width: 50%; margin-top: 10px; }
      .f label, legend { font-size: 0.8rem; font-weight: 500; color: var(--fw-ink); }
      .in { border: 1.5px solid var(--fw-line-strong); border-radius: 10px; padding: 0 12px; height: 44px; font: 400 0.9rem Poppins, sans-serif; background: #fff; color: var(--fw-ink); width: 100%; box-sizing: border-box; } .in:focus { outline: 0; border-color: var(--fw-blue); box-shadow: 0 0 0 3px rgba(28, 109, 240, 0.15); } .in[readonly] { background: #f3f6fb; color: var(--fw-muted); }
      .err { color: #b91c1c; font-size: 0.76rem; }
      .radios { border: 0; padding: 0; margin: 14px 0; display: flex; gap: 10px 22px; flex-wrap: wrap; align-items: center; } .radios legend { width: 100%; margin-bottom: 6px; padding: 0; } .radio { display: inline-flex; gap: 8px; align-items: center; font-size: 0.9rem; cursor: pointer; }
      .safe { display: flex; gap: 12px; align-items: center; background: #f3f8ff; border: 1px solid #dbe8fb; border-radius: 12px; padding: 12px 14px; margin: 16px 0 4px; } .safe .material-icons { color: var(--fw-blue); font-size: 28px; } .safe div { display: grid; } .safe small { color: var(--fw-muted); font-size: 0.74rem; }
      .nav { display: flex; justify-content: space-between; gap: 12px; margin-top: 20px; }
      .doc { display: flex; gap: 12px; align-items: center; padding: 12px 14px; border: 1px solid var(--fw-line); border-radius: 12px; margin-bottom: 10px; } .doc.has { border-color: #bbe5c8; background: #f4fbf6; }
      .doc__ic { color: var(--fw-blue); background: var(--fw-blue-soft); border-radius: 10px; padding: 8px; } .doc__t { flex: 1; display: grid; min-width: 0; } .doc__t b { font-size: 0.9rem; } .doc__t small { color: var(--fw-muted); font-size: 0.74rem; overflow-wrap: anywhere; } .doc__t .ok { color: #15803d; display: flex; gap: 4px; align-items: center; } .ok .material-icons { font-size: 16px; }
      .up { position: relative; overflow: hidden; } .up input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
      .note { display: flex; gap: 8px; align-items: center; font-size: 0.78rem; color: var(--fw-muted); margin-top: 8px; } .note .material-icons { font-size: 18px; color: var(--fw-blue); }
      .rev { border: 1px solid var(--fw-line); border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; } .rev__h { display: flex; align-items: center; gap: 8px; } .rev__h .material-icons { color: var(--fw-blue); } .rev__h b { flex: 1; } .edit { background: none; border: 1px solid var(--fw-line-strong); border-radius: 6px; color: var(--fw-blue); cursor: pointer; font: 600 0.76rem Poppins, sans-serif; padding: 3px 12px; }
      .rev p { margin: 6px 0 0 32px; font-size: 0.84rem; color: var(--fw-muted); line-height: 1.55; }
      .agree { display: flex; gap: 10px; align-items: flex-start; font-size: 0.82rem; margin-top: 10px; line-height: 1.5; } .agree input { margin-top: 4px; }
      .progress { display: flex; gap: 10px; align-items: center; justify-content: center; font-size: 0.86rem; color: var(--fw-muted); margin: 8px 0; } .spin { width: 18px; height: 18px; border: 3px solid #cfe0ff; border-top-color: var(--fw-blue); border-radius: 50%; animation: sp 0.8s linear infinite; } @keyframes sp { to { transform: rotate(360deg); } }
      .done { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr); gap: 16px; margin-bottom: 16px; align-items: start; }
      .done__main { text-align: center; display: grid; gap: 10px; justify-items: center; background: linear-gradient(180deg, #f4f8ff, #fff 40%); border: 1px solid var(--fw-line); border-radius: 14px; padding: 26px 22px; min-width: 0; }
      .tick { width: 84px; height: 84px; border-radius: 50%; background: #16a34a; display: grid; place-items: center; color: #fff; box-shadow: 0 0 0 10px rgba(22, 163, 74, 0.12); } .tick .material-icons { font-size: 52px; }
      .done h1 span { color: #16a34a; } .done h2 { margin: 0; font-size: 1.3rem; } .done p { margin: 0; color: var(--fw-muted); max-width: 520px; }
      .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; border: 1px solid var(--fw-line); border-radius: 12px; padding: 12px; background: #fff; } .facts div { display: grid; justify-items: center; gap: 2px; } .facts .material-icons { color: var(--fw-blue); } .facts .g { color: #16a34a; } .facts small { color: var(--fw-muted); font-size: 0.72rem; } .facts b { font-size: 0.86rem; overflow-wrap: anywhere; }
      .steps { list-style: none; margin: 4px 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); width: 100%; } .st { position: relative; display: grid; justify-items: center; gap: 2px; padding: 0 2px; text-align: center; }
      .st:not(:last-child)::after { content: ''; position: absolute; top: 18px; left: calc(50% + 20px); right: calc(-50% + 20px); height: 3px; background: #d7dfec; } .st--done:not(:last-child)::after { background: #16a34a; }
      .dot { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: #cdd6e4; color: #fff; position: relative; z-index: 1; } .st--done .dot { background: #16a34a; } .st--now .dot { background: var(--fw-blue); box-shadow: 0 0 0 4px rgba(28, 109, 240, 0.18); }
      .st b { font-size: 0.72rem; margin-top: 6px; line-height: 1.25; } .st em { font-style: normal; font-size: 0.66rem; color: var(--fw-muted); background: #eef2f8; border-radius: 6px; padding: 1px 7px; } .st--done em { background: #dcfce7; color: #15803d; } .st--now em { background: #dbeafe; color: #1d4ed8; }
      .keep { display: flex; gap: 12px; align-items: center; text-align: left; background: var(--fw-blue-soft); border-radius: 12px; padding: 12px 14px; width: 100%; } .keep > .material-icons { color: #fff; background: var(--fw-blue); border-radius: 50%; padding: 9px; } .keep div { display: grid; } .keep small { color: var(--fw-muted); font-size: 0.76rem; }
      .cta { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; width: 100%; } .wa { color: #15803d; border-color: #86d9a1; }
      .next h3, .more h3 { margin: 0 0 10px; font-size: 1.05rem; } .next ol { list-style: none; margin: 0 0 14px; padding: 0; display: grid; gap: 12px; } .next li { display: flex; gap: 12px; } .next li > span { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #16a34a; color: #16a34a; display: grid; place-items: center; font-weight: 600; font-size: 0.8rem; flex: none; } .next li div { display: grid; line-height: 1.3; } .next small, .q small { color: var(--fw-muted); font-size: 0.76rem; }
      .q { display: grid; gap: 4px; background: var(--fw-blue-soft); border-radius: 12px; padding: 14px; justify-items: start; }
      .mh { display: flex; justify-content: space-between; align-items: center; } .mh a { color: var(--fw-blue); text-decoration: none; font-size: 0.82rem; font-weight: 600; } .mg { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 8px; }
      .mg a { display: flex; gap: 10px; align-items: center; padding: 12px; border: 1px solid var(--fw-line); border-radius: 12px; text-decoration: none; color: var(--fw-ink); } .mg a:hover { border-color: var(--fw-blue); } .mg .material-icons { color: var(--fw-blue); background: var(--fw-blue-soft); border-radius: 10px; padding: 8px; } .mg a > span:last-child { display: grid; line-height: 1.3; min-width: 0; } .mg small { color: var(--fw-muted); font-size: 0.72rem; }
      .why { display: grid; gap: 10px; align-content: center; overflow: hidden; background: linear-gradient(135deg, #f4f8ff, #fff 70%); } .why .eh { margin: 0; }
      .why__list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
      .why__list li { display: flex; gap: 10px; align-items: center; min-width: 0; } .why__list .material-icons { color: #16a34a; background: #eaf8ef; border-radius: 10px; padding: 8px; font-size: 20px; flex: none; } .why__list li > span:last-child { display: grid; line-height: 1.3; min-width: 0; } .why__list b { font-size: 0.84rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .why__list small { color: var(--fw-muted); font-size: 0.72rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* Desktop: the whole first step fits one screen, no scrolling. */
      @media (min-width: 1101px) {
        .s1 { gap: 14px; align-items: stretch; height: calc(100dvh - 160px); min-height: 480px; } .left { grid-template-rows: auto 1fr; } .left { min-height: 0; } .extra { grid-template-rows: auto auto minmax(0, 1fr); min-height: 0; } .s1 .calc { display: flex; flex-direction: column; justify-content: space-between; align-self: stretch; } .s1 .calc .slider { margin-bottom: 0; } .s1 .calc .emi { margin-bottom: 0; } .left { gap: 14px; } .extra { gap: 14px; }
        .s1 .hero { min-height: 0; padding: 18px 22px; } .s1 .hero h1 { margin: 4px 0; font-size: 2rem; } .s1 .hero p { margin: 0 0 10px; }
        .s1 .calc.pad { padding: 16px 20px; } .s1 .slider { margin-bottom: 10px; gap: 2px 12px; } .s1 .slider b { font-size: 1.05rem; }
        .s1 .emi { padding: 10px 14px; margin-bottom: 12px; } .s1 .emi strong { font-size: 1.3rem; }
        .s1 .extra .pad { padding: 14px 18px; } .s1 .facts4 li { padding: 10px 12px; } .s1 .eh { margin-bottom: 8px; }
      }
      @media (max-width: 1100px) { .calc { position: static; } .facts4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .how { grid-template-columns: repeat(2, minmax(0, 1fr)); } .s1, .done { grid-template-columns: minmax(0, 1fr); } .mg { grid-template-columns: repeat(2, 1fr); } .why__list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } .half { max-width: none; } .prog b { display: none; } .chips { grid-template-columns: repeat(2, 1fr); } .hero { flex-direction: column-reverse; align-items: flex-start; } .facts { grid-template-columns: 1fr; } .steps { grid-template-columns: 1fr; gap: 12px; } .st { grid-template-columns: 38px 1fr auto; justify-items: start; text-align: left; align-items: center; gap: 0 10px; } .st:not(:last-child)::after { display: none; } .st b { margin: 0; } .nav { flex-wrap: wrap; } .mg { grid-template-columns: 1fr; } .doc { flex-wrap: wrap; } }
      /* Phone: a tidy banner - loan picker, title and tagline on the left, the picture on the right, then a 2 x 2 chip grid. */
      @media (max-width: 640px) {
        .extra { display: none; }
        .hero { display: grid; grid-template-columns: minmax(0, 1fr) 84px; gap: 6px 14px; align-items: start; min-height: 0; padding: 16px; }
        .hero__txt { display: contents; }
        .hero h1 { grid-column: 1; grid-row: 1; margin: 4px 0 0; font-size: 1.6rem; line-height: 1.15; overflow-wrap: anywhere; }
        .hero__txt > p { grid-column: 1; grid-row: 2; font-size: 0.88rem; line-height: 1.4; }
        .hero img { grid-column: 2; grid-row: 1 / span 2; width: 84px; height: 84px; border-radius: 14px; }
        .chips { grid-column: 1 / -1; grid-row: 3; margin-top: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .chips li { grid-auto-flow: column; grid-template-columns: auto minmax(0, 1fr); justify-content: start; justify-items: start; align-items: center; text-align: left; gap: 8px; padding: 9px 10px; font-size: 0.72rem; line-height: 1.25; min-width: 0; overflow-wrap: anywhere; hyphens: auto; }
        .chips li br { display: none; }
        .chips .material-icons { font-size: 20px; }
      }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class AccountApplyComponent {
  private readonly portal = inject(CustomerPortalService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly auth = inject(AuthService);

  protected readonly site = WEBSITE;
  protected readonly stepLabels = STEP_LABELS;
  protected readonly stages = STAGES;
  protected readonly docs = DOCS;
  protected readonly products = PRODUCT_PAGES;
  protected readonly reasons = [
    { icon: 'compare_arrows', title: 'Multiple lenders', text: 'One form, more options' },
    { icon: 'support_agent', title: 'Expert guidance', text: 'Help at every step' },
    { icon: 'track_changes', title: 'Live tracking', text: 'Status in your account' },
    { icon: 'lock', title: 'Secure data', text: 'Encrypted documents' },
  ];
  protected readonly purposes = PURPOSES;
  protected readonly employmentTypes = EMPLOYMENT;
  protected readonly cities = signal<string[]>([...CITIES]);
  protected readonly years = Array.from({ length: 41 }, (_, i) => i);
  protected readonly rate = signal(EST_RATE);
  protected readonly updateProfile = signal(true);
  protected readonly more = PRODUCT_PAGES.filter((p) => ['personal-loan', 'business-loan', 'loan-against-property', 'education-loan'].includes(p.slug));
  protected readonly maxDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10); })();

  protected readonly step = signal(1);
  protected readonly prefilled = signal(false);
  protected readonly hadApplication = signal(false);
  protected readonly aadhaarHint = signal<string | null>(null);
  private readonly profileSvc = inject(CustomerProfileService);
  protected readonly product = signal('personal-loan');
  protected readonly amount = signal(500000);
  protected readonly months = signal(36);
  protected readonly files = signal<Record<string, File | undefined>>({});
  protected readonly docError = signal<string | null>(null);
  protected readonly docsMissing = signal(false);
  protected readonly consent = signal(false);
  protected readonly consentMissing = signal(false);

  protected readonly busy = signal(false);
  protected readonly progress = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<CustomerApplication | null>(null);
  protected readonly failedDocs = signal<string[]>([]);
  private readonly idempotencyKey = newKey();

  protected readonly current = computed(() => PRODUCT_PAGES.find((p) => p.slug === this.product()) ?? PRODUCT_PAGES[0]);
  protected readonly art = computed(() => loanSquare(this.product()));
  protected readonly emi = computed(() => calculateEmi(this.amount(), this.rate(), this.months()));

  protected readonly personal = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
    dob: ['', [Validators.required, adult]],
    gender: ['', Validators.required],
    marital: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(PHONE)]],
    pan: ['', [Validators.required, Validators.pattern(PAN)]],
    aadhaar: ['', [Validators.required, Validators.pattern(/^\d{4} ?\d{4} ?\d{4}$/)]],
  });
  protected readonly employment = this.fb.nonNullable.group({
    type: ['', Validators.required],
    company: ['', [Validators.required, Validators.maxLength(150)]],
    designation: ['', [Validators.required, Validators.maxLength(100)]],
    experience: ['', Validators.required],
    income: [null as number | null, [Validators.required, Validators.min(1)]],
    city: ['', Validators.required],
    address: ['', [Validators.required, Validators.maxLength(255)]],
  });
  protected readonly loan = this.fb.nonNullable.group({
    purpose: ['', Validators.required],
    amount: [500000, [Validators.required, Validators.min(1000), Validators.max(1000000000)]],
    tenure: [36, Validators.required],
    existing: [false],
    existingEmi: [null as number | null, Validators.min(0)],
  });

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    const wanted = q.get('product');
    if (wanted && PRODUCT_PAGES.some((p) => p.slug === wanted)) this.product.set(wanted);
    const amt = Number(q.get('amount'));
    if (amt >= 50000 && amt <= 5000000) this.amount.set(amt);
    const yrs = Number(q.get('years'));
    if (yrs >= 0.5 && yrs <= 5) this.months.set(Math.round(yrs * 12));
    this.personal.controls.phone.setValue(this.auth.user()?.phone ?? '');
    this.personal.controls.name.setValue(this.auth.user()?.name ?? '');
    this.personal.controls.email.setValue(this.auth.user()?.email ?? '');
    this.loadPrefill();
  }

  /**
   * Fills the forms from what we already know (profile, KYC PAN, last application). Only empty fields are filled,
   * so nothing the customer has typed in the meantime is overwritten. A failed lookup is simply ignored.
   */
  private loadPrefill(): void {
    this.profileSvc.prefill().subscribe({
      next: (d) => this.applyPrefill(d),
      error: () => undefined,
    });
  }

  private applyPrefill(d: PrefillView): void {
    let filled = false;
    const put = (ctrl: AbstractControl, value: string | number | null | undefined): void => {
      if (value === null || value === undefined || value === '') return;
      if (ctrl.value !== null && ctrl.value !== undefined && String(ctrl.value).trim() !== '') return;
      ctrl.setValue(typeof value === 'number' ? value : value);
      filled = true;
    };
    const p = this.personal.controls;
    put(p.name, d.name);
    put(p.email, d.email);
    put(p.phone, d.phone);
    put(p.dob, d.dob);
    put(p.gender, d.gender);
    put(p.marital, d.marital_status);
    put(p.pan, d.pan);
    // The customer's own saved Aadhaar fills the field (they can still change it); otherwise just remind them.
    if (d.aadhaar) put(p.aadhaar, d.aadhaar.replace(/(\d{4})(?=\d)/g, '$1 '));
    this.aadhaarHint.set(d.aadhaar ? null : d.aadhaar_last4);

    const e = this.employment.controls;
    put(e.type, d.employment_type);
    put(e.company, d.company);
    put(e.designation, d.designation ?? d.occupation);
    put(e.experience, d.experience_years !== null ? String(Math.min(40, Math.max(0, Math.round(d.experience_years)))) : null);
    put(e.income, d.monthly_income);
    put(e.address, d.office_address);
    if (d.city) {
      if (!this.cities().includes(d.city)) this.cities.update((c) => [...c.slice(0, -1), d.city as string, c[c.length - 1]]);
      put(e.city, d.city);
    }

    this.hadApplication.set(d.has_saved_application);
    if (filled) this.prefilled.set(true);
  }

  // ── navigation ────────────────────────────────────────────────────────────────

  protected go(n: number): void {
    this.error.set(null);
    this.step.set(n);
    this.host.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected setProduct(slug: string): void {
    this.product.set(slug);
  }

  protected readonly menu = signal(false);

  protected focusSibling(e: Event, dir: 'nextElementSibling' | 'previousElementSibling'): void {
    e.preventDefault();
    ((e.target as HTMLElement)[dir] as HTMLElement | null)?.focus();
  }

  protected choose(slug: string): void {
    this.setProduct(slug);
    this.menu.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected closeMenu(e: Event): void {
    if (this.menu() && !(e.target as HTMLElement).closest('.pick')) this.menu.set(false);
  }

  @HostListener('document:keydown.escape')
  protected escMenu(): void {
    this.menu.set(false);
  }

  /** Entering step 2 from the sliders copies the chosen amount and tenure into the loan form. */
  protected next(form: { invalid: boolean; markAllAsTouched(): void }, to: number): void {
    if (form.invalid) {
      form.markAllAsTouched();
      queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('.err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    if (to === 4) this.syncLoanFromStart();
    this.go(to);
  }

  private syncLoanFromStart(): void {
    const l = this.loan.controls;
    if (!l.amount.dirty) l.amount.setValue(this.amount());
    if (!l.tenure.dirty) l.tenure.setValue(this.months());
  }

  /** Tenure choices, plus the one picked on the first screen when it isn't a standard option. */
  protected tenureOptions(): number[] {
    const t = Number(this.loan.controls.tenure.value);
    return TENURES.includes(t) || !t ? TENURES : [...TENURES, t].sort((a, b) => a - b);
  }

  protected bad(form: { controls: Record<string, AbstractControl> }, name: string): boolean {
    const c = form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  // ── step 2 helpers ────────────────────────────────────────────────────────────

  protected upper(e: Event): void {
    const el = e.target as HTMLInputElement;
    el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.personal.controls.pan.setValue(el.value);
  }

  protected groupAadhaar(e: Event): void {
    const el = e.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '').slice(0, 12);
    el.value = d.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.personal.controls.aadhaar.setValue(el.value);
  }

  // ── step 5: documents ─────────────────────────────────────────────────────────

  protected readonly accept = acceptFor;

  protected pickFile(d: Doc, e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const blocked = typeError(d.type, file);
    if (blocked) {
      this.docError.set(blocked);
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      this.docError.set(`“${file.name}” isn’t supported. Please upload a PDF, JPG or PNG.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      this.docError.set(`“${file.name}” is ${(file.size / 1048576).toFixed(1)} MB — the limit is 5 MB.`);
      return;
    }
    this.docError.set(null);
    this.docsMissing.set(false);
    this.files.update((f) => ({ ...f, [d.type]: file }));
  }

  protected removeFile(d: Doc): void {
    this.files.update((f) => ({ ...f, [d.type]: undefined }));
  }

  protected nextDocs(): void {
    if (DOCS.some((d) => !this.files()[d.type])) {
      this.docsMissing.set(true);
      return;
    }
    this.go(6);
  }

  protected size(bytes: number): string {
    return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  protected docNames(): string {
    return DOCS.map((d) => d.label).join(', ');
  }

  // ── step 6: review ────────────────────────────────────────────────────────────

  protected cap(v: string): string {
    return v ? v[0].toUpperCase() + v.slice(1) : '';
  }

  protected aadhaarLast4(): string {
    return this.personal.controls.aadhaar.value.replace(/\D/g, '').slice(-4);
  }

  protected employmentLabel(): string {
    return EMPLOYMENT.find((t) => t.value === this.employment.controls.type.value)?.label ?? '';
  }

  protected submitApplication(): void {
    if (this.busy()) return;
    if (!this.consent()) {
      this.consentMissing.set(true);
      return;
    }
    this.consentMissing.set(false);
    this.busy.set(true);
    this.error.set(null);
    void this.submit();
  }

  // ── submit ────────────────────────────────────────────────────────────────────

  private payload(): ApplyPayload {
    const p = this.personal.getRawValue();
    const e = this.employment.getRawValue();
    const l = this.loan.getRawValue();
    return {
      product: this.product(),
      loan_amount: Number(l.amount),
      tenure_months: Number(l.tenure),
      monthly_income: Number(e.income),
      existing_emi: l.existing && l.existingEmi ? Number(l.existingEmi) : null,
      employment_type: e.type,
      city: e.city,
      applicant_phone: p.phone,
      applicant_name: p.name.trim(),
      applicant_email: p.email.trim(),
      update_profile: this.updateProfile(),
      consent: true,
      idempotency_key: this.idempotencyKey,
      applicant: { dob: p.dob, gender: p.gender, marital_status: p.marital, pan: p.pan, aadhaar: p.aadhaar.replace(/\s/g, '') },
      employment: { company: e.company.trim(), designation: e.designation.trim(), experience_years: Number(e.experience), office_address: e.address.trim() },
      loan: { purpose: l.purpose, has_existing_loans: l.existing },
    };
  }

  private async submit(): Promise<void> {
    try {
      this.progress.set('Submitting your application…');
      const app = await firstValueFrom(this.portal.apply(this.payload()));
      const failed: string[] = [];
      let n = 0;
      for (const d of DOCS) {
        const file = this.files()[d.type];
        if (!file) continue;
        this.progress.set(`Uploading documents (${++n}/${DOCS.length})…`);
        try {
          await firstValueFrom(this.portal.uploadDocument(app.id, d.type, file));
        } catch {
          failed.push(d.label);
        }
      }
      if (this.updateProfile()) this.auth.loadCurrentUser().subscribe({ error: () => undefined });
      this.failedDocs.set(failed);
      this.result.set(app);
      this.busy.set(false);
      this.step.set(7);
      this.host.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      this.busy.set(false);
      this.error.set(this.message(e as { message?: string; errors?: Record<string, string[]> }, 'We couldn’t submit your application. Please try again.'));
    }
  }

  private message(e: { message?: string; errors?: Record<string, string[]> }, fallback: string): string {
    return Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? fallback;
  }

  protected first(): string {
    return (this.personal.controls.name.value || this.auth.user()?.name || '').split(' ')[0];
  }

  /** Indicative EMI for the amount and tenure currently in the loan form. */
  protected loanEmi(): number {
    const l = this.loan.controls;
    return calculateEmi(Number(l.amount.value) || 0, this.rate(), Number(l.tenure.value) || 1);
  }

  protected fmt(v: number): string {
    return formatInr(v);
  }
}
