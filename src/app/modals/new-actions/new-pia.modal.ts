import { Component } from '@angular/core';
import { BaseModalComponent } from 'app/modals/base-modal.component';
import { Router } from '@angular/router';
import { ModalService } from 'app/modals/modal.service';
import { PiaModel, PiaType } from '@api/models';
import { FormGroup, FormControl } from '@angular/forms';
import { PiaApi } from '@api/services';
import { PiaService } from 'app/entry/pia.service';


@Component({
    selector: 'new-pia-modal',
    template: `
    <div class="pia-modalBlock" id="new-pia-modal">
    <div class="pia-modalBlock-content bounceIn">
        <button tabindex="1" type="button" class="pia-modalBlock-close btn" title="{{ 'homepage.cards.title_close_creation' | translate }}"
            (click)="close()">
            <span class="pia-icons pia-icon-close"></span>
        </button>
        <form class="pia-cardsBlock-item-form" (ngSubmit)="onSubmit()" [formGroup]="piaForm">
            <div>
                <label for="name">{{ 'homepage.cards.pia_name' | translate }}</label>
                <input formControlName="name" type="text" placeholder="{{ 'homepage.cards.placeholder_pia_name' | translate }}" id="name"
                    required>
            </div>
            <div *ngIf="false">
                <label for="type">{{ 'homepage.cards.pia_type' | translate }}</label>
                <select formControlName="type" id="type"
                    required>
                    <option *ngFor="let type of piaTypes" value="{{ type }}">{{ 'homepage.cards.pia_types.' + type | translate }}</option>
                </select>
            </div>
            <div>
                <label for="author_name">{{ 'homepage.cards.author' | translate }}</label>
                <input formControlName="author_name" type="text" placeholder="{{ 'homepage.cards.placeholder_author' | translate }}" id="author_name"
                    required>
            </div>
            <div>
                <label for="evaluator_name">{{ 'homepage.cards.evaluation' | translate }}</label>
                <input formControlName="evaluator_name" type="text" placeholder="{{ 'homepage.cards.placeholder_evaluation' | translate }}"
                    id="evaluator_name" required>
            </div>
            <div>
                <label for="validator_name">{{ 'homepage.cards.validation' | translate }}</label>
                <input formControlName="validator_name" type="text" placeholder="{{ 'homepage.cards.placeholder_validation' | translate }}"
                    id="validator_name" required>
            </div>
            <div class="pia-cardsBlock-item-date" *ngIf="newPia">
                <div>{{ 'homepage.cards.date' | translate }}</div>
                <time>{{ newPia.created_at | date: 'dd/MM/yyyy'}}</time>
            </div>
            <div class="pia-cardsBlock-item-status">
                <div class="pia-cardsBlock-item-status-infos">
                    <div>{{ 'homepage.cards.status' | translate }}</div>
                    <div>{{ 'homepage.cards.creation_status' | translate }}</div>
                </div>
                <div class="pia-cardsBlock-item-status-progressBar">
                    <div>0%</div>
                    <progress max="100" value="0">
                    </progress>
                </div>
            </div>
            <div class="pia-cardsBlock-item-btn">
                <button type="submit" [disabled]="piaForm.invalid" class="btn btn-green get-focus" id="pia-save-card-btn">{{ 'homepage.cards.start' | translate }}</button>
            </div>
        </form>
    </div>
</div>
`,
    styleUrls: ['./new-actions-modals.scss'],
    providers: []
})


export class NewPiaModal extends BaseModalComponent {

    newPia: PiaModel;
    piaForm: FormGroup;
    piaTypes: any;

    constructor(router: Router, modalService: ModalService, private piaApi: PiaApi, public _piaService: PiaService) {
        super(router, modalService);

        this.piaForm = new FormGroup({
            name: new FormControl(),
            author_name: new FormControl(),
            evaluator_name: new FormControl(),
            validator_name: new FormControl(),
            type: new FormControl()
        });
        this.newPia = new PiaModel();
        this.piaTypes = Object.values(PiaType);
    }


    onSubmit() {
        const pia = new PiaModel();
        pia.name = this.piaForm.value.name;
        pia.author_name = this.piaForm.value.author_name;
        pia.evaluator_name = this.piaForm.value.evaluator_name;
        pia.validator_name = this.piaForm.value.validator_name;
        pia.type = "advanced";//this.piaForm.value.type;

        this.piaApi.create(pia, this._piaService.currentFolder).subscribe((newPia: PiaModel) => {
            this.piaForm.reset();
            this.router.navigate(['entry', newPia.id, 'section', 1, 'item', 1]);
        });
    }

}
