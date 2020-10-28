import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalsService } from 'app/modals/modals.service'
import { ProcessingApi } from '@api/services';
import { ProcessingModel, TemplateModel } from '@api/models';
import { PiaService } from '../entry/pia.service';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss']
})
export class TemplatesComponent implements OnInit {
  public templates: TemplateModel[];
  protected pickedTemplate: TemplateModel;
  public processing: ProcessingModel = new ProcessingModel();
  public processingForm: FormGroup;

  constructor(
    protected processingApi: ProcessingApi,
    protected router: Router,
    private route: ActivatedRoute,
    public _modalsService: ModalsService,
    private _piaService: PiaService
  ) {
  }

  ngOnInit() {
    this.templates = this.route.snapshot.data.templates;

    this.processingForm = new FormGroup({
      author: new FormControl(),
      designated_controller: new FormControl()
    });

    if(this._piaService.currentFolder == null){
      this.router.navigate(['dashboard']);
    }
  }

  onSubmitProcessing() {

    let processing = new ProcessingModel();
    processing.author = this.processingForm.value.author;
    processing.designated_controller = this.processingForm.value.designated_controller;
    processing.folder = this._piaService.currentFolder;

    this.processingApi.createFromTemplate(processing, this.pickedTemplate).subscribe((newProcessing: ProcessingModel) => {
      this.processingForm.reset();
      this.router.navigate(['processing', newProcessing.id]);
    });
  }

  protected processingFromTemplate(template: TemplateModel) {
    this.pickedTemplate = template;
    this._modalsService.openModal('modal-list-new-processing');
  }

}
