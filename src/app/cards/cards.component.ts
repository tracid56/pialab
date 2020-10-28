import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Angular5Csv } from 'angular5-csv/dist/Angular5-csv';
import { saveAs } from 'file-saver';
import * as Moment from 'moment';

import { ModalsService } from 'app/modals/modals.service';
import { PiaService } from 'app/entry/pia.service';
import { environment } from 'environments/environment';

import { FolderModel, ProcessingModel, EvaluationModel, PiaModel } from '@api/models';
import { FolderApi, ProcessingApi, MeasureApi, EvaluationApi, PiaApi, AnswerApi } from '@api/services';
import { PermissionsService } from '@security/permissions.service';
import { ProfileSession } from '../services/profile-session.service';
import { TranslateService } from '@ngx-translate/core';


interface FolderCsvRow {
  name: string;
  id: number;
  path: string;
  parent_id?: number;
  person_in_charge: string;
  structure_id: number;
}

interface ProcessingCsvRow {
  id: number;
  parent_id: number;
  author: string;
  created_at: string;
  updated_at: string;
  concerned_people: string;
  consent: string;
  context_of_implementation: string;
  controllers: string;
  description: string;
  designated_controller: string;
  exactness: string;
  lawfulness: string;
  life_cycle: string;
  minimization: string;
  name: string;
  non_eu_transfer: string;
  processors: string;
  rights_guarantee: string;
  standards: string;
  status: string;
  storage: string;
  processing_data_types: string;
  recipients: string;
}


interface PiaCsvRow {
  id: number;
  processing_id: number;
  author_name: string;
  concerned_people_opinion: string;
  concerned_people_searched_content: string;
  concerned_people_searched_opinion: string;
  concerned_people_status: number;
  dpo_opinion: string;
  dpo_status: number;
  dpos_names: string;
  evaluator_name: string;
  is_example: boolean;
  number_of_questions: number;
  people_names: string;
  progress: number;
  rejection_reason: string;
  status: string;
  type: string;
  validator_name: string;
  answers: any;
  created_at: Date;
  updated_at: Date;
}

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})

export class CardsComponent implements OnInit {
  newProcessing: ProcessingModel;
  processingForm: FormGroup;
  // importPiaForm: FormGroup;
  sortOrder: string;
  sortValue: string;
  viewStyle: { view: string }
  view: 'card';
  folderId: number;
  itemToMove: any = null;
  folderToExport: FolderCsvRow[] = [];
  processingToExport: ProcessingCsvRow[] = [];
  piaToExport: PiaCsvRow[] = [];
  piaToExportOdt: any = [];
  exportIsLoading: boolean = false;
  // canCreatePIA: boolean;
  canCreateProcessing: boolean;
  selectedFolder: any = [];
  selectedProcessing: any = [];
  public structure: any;

  constructor(
    private route: ActivatedRoute,
    public _modalsService: ModalsService,
    public _piaService: PiaService,
    private measureApi: MeasureApi,
    private piaApi: PiaApi,
    private evaluationApi: EvaluationApi,
    private permissionsService: PermissionsService,
    private processingApi: ProcessingApi,
    private folderApi: FolderApi,
    private answerApi: AnswerApi,
    private session: ProfileSession,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.structure = this.session.getCurrentStructure();
    this.permissionsService.hasPermission('CanCreateProcessing').then((bool: boolean) => {
      this.canCreateProcessing = bool;
    });
    this.applySortOrder();
    // this.initPiaForm();
    this.initProcessingForm();
  }


  /**
   * Sort items.
   * @param {string} fieldToSort - Field to sort.
   * @memberof CardsComponent
   */
  sortBy(fieldToSort: string) {
    this.sortValue = fieldToSort;
    this.sortOrder = this.sortOrder === 'down' ? 'up' : 'down';
    this.sortElements();
    localStorage.setItem('sortValue', this.sortValue);
    localStorage.setItem('sortOrder', this.sortOrder);
  }

  /**
   * Display elements in list view.
   * @memberof CardsComponent
   */
  viewOnList() {
    this.viewStyle.view = 'list';
    localStorage.setItem('homepageDisplayMode', this.viewStyle.view);
    this.refreshContent();
  }

  /**
   * Display elements in card view.
   * @memberof CardsComponent
   */
  viewOnCard() {
    this.viewStyle.view = 'card';
    localStorage.setItem('homepageDisplayMode', this.viewStyle.view);
    this.refreshContent();
  }

  /**
   * Refresh the list.
   * @memberof CardsComponent
   */
  async refreshContent() {
    const theFolders = await this.fetchFolders();

    this.handleFoldersCollection(theFolders);

    this.sortOrder = localStorage.getItem('sortOrder');
    this.sortValue = localStorage.getItem('sortValue');
    this.sortElements();
  }

  protected fetchFolders() {
    if (this.folderId !== null) {
      return this.folderApi.get(this.structure.id, this.folderId).toPromise()
    }
    return this.folderApi.getAll(this.structure.id).toPromise();
  }

  protected handleFoldersCollection(folderOrFolderCollection: any) {
    let folder: FolderModel;
    if (folderOrFolderCollection instanceof FolderModel) {
      folder = folderOrFolderCollection;
    } else {
      folder = folderOrFolderCollection[0];
    }
    this._piaService.currentFolder = folder;
    this._piaService.processings = folder.processings;
    this._piaService.folders = folder.children;
  }

  /**
   * Define how to sort the list.
   * @private
   * @memberof CardsComponent
   */
  protected sortElements() {
    if (this._piaService.processings !== undefined) {
      this._piaService.processings.sort((a, b) => {
        let firstValue = a[this.sortValue];
        let secondValue = b[this.sortValue];
        if (this.sortValue === 'updated_at' || this.sortValue === 'created_at') {
          firstValue = new Date(a[this.sortValue]);
          secondValue = new Date(b[this.sortValue]);
        }
        if (this.sortValue === 'name' || this.sortValue === 'author') {
          return firstValue.localeCompare(secondValue);
        } else {
          if (firstValue < secondValue) {
            return -1;
          }
          if (firstValue > secondValue) {
            return 1;
          }
          return 0;
        }
      });
      if (this.sortOrder === 'up') {
        this._piaService.processings.reverse();
      }
    }
  }

  protected applySortOrder() {
    this.sortOrder = localStorage.getItem('sortOrder');
    this.sortValue = localStorage.getItem('sortValue');

    if (!this.sortOrder || !this.sortValue) {
      this.sortOrder = 'up';
      this.sortValue = 'updated_at';
      localStorage.setItem('sortOrder', this.sortOrder);
      localStorage.setItem('sortValue', this.sortValue);
    }
  }

  protected initProcessingForm() {
    this.processingForm = new FormGroup({
      name: new FormControl(),
      author: new FormControl(),
      controllers: new FormControl()
    });
    this.viewStyle = {
      view: this.route.snapshot.params['view']
    }

    this.route.params.subscribe(
      (params: Params) => {
        this.viewStyle.view = params['view'];
        this.folderId = (params.id ? params.id : null);
        this.viewOnCard();
        /*if (localStorage.getItem('homepageDisplayMode') === 'list') {
          this.viewOnList();
        } else {
          this.viewOnCard();
        }*/
      }
    );
  }

  onDragStart(item: any) {
    this.itemToMove = item;
  }

  onDragCanceled() {
    this.itemToMove = null;
  }

  onDrop(targetFolder: FolderModel) {
    if (this.itemToMove) {
      if (this.itemToMove instanceof FolderModel) {
        if (this.itemToMove.id === parseInt(targetFolder.id, 10)) {
          return;
        }

        this.itemToMove.parent = targetFolder;

        this.folderApi.update(this.itemToMove).subscribe(() => {
          this.refreshContent();
        });

        return;
      }

      this.itemToMove.folder = targetFolder;

      this.processingApi.update(this.itemToMove).subscribe(() => {
        this.refreshContent();
      });
    }
  }

  private currentFolderIsRoot(): boolean {
    return this._piaService.currentFolder.parent.isRoot;
  }

  getRouteToParentFolder(): string {
    let route = '/folders';
    if (!this.currentFolderIsRoot()) {
      const parentId = this._piaService.currentFolder.parent.id;
      route = '/folders/' + parentId;
    }
    return route;
  }

  handleFolderCheckChange(event) {
    if (event.checked) {
      this.selectedFolder.push(event.id)
    } else {
      this.selectedFolder = this.selectedFolder.filter(folderId => folderId !== event.id)
    }
  }

  handleProcessingCheckChange(event) {
    if (event.checked) {
      this.selectedProcessing.push(event.id)
    } else {
      this.selectedProcessing = this.selectedProcessing.filter(processId => processId !== event.id)
    }
  }

  geth1Title(title: string) {
    return `<h1>${title}</h1>`
  }

  geth2Title(title: string) {
    return `<h2>${title}</h2>`
  }

  geth3Title(title: string) {
    return ` <h3>${title}</h3>`
  }

  getBorderedP(content: string) {
    return `<p style="border: 1px solid #a7a7a7; padding: 0.24cm 0.32cm;">${content}</p>`
  }

  getP(content: string) {
    return `<p>${content}</p>`
  }

  getBorderedEvaluation(evaluation: string, comment: string = null) {
    return `<p style="border: 1px dotted #a7a7a7; padding: 0.24cm 0.32cm;>
        Evaluation: ${evaluation}
        ${comment ? `<br/>Evaluation comment: ${comment}` : ''}
    </p>`
  }

  getProcessingDataTypes(dataTypes) {
    if (!dataTypes) { return''; }
    let processingDataTypes = ``;

    dataTypes.forEach(type =>
      processingDataTypes += this.getP(`
      <p>- ${this.translate.instant(`processing-data-types.form.${type.reference}`)}</p>
      <p>
        <span>${this.translate.instant(`processing-data-types.form.retention-period`)} ${type.retention_period} (${this.translate.instant(`types.sensitive ? 'sensitive' : ''`)})</span>
      </p>
      `)
      )

    return processingDataTypes;
  }

  getPiaInformation(data) {
    let piaInformations = `${this.geth1Title('PIA information')}`;

    if (data.name && data.name.length > 0) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.pia_name'))}
      ${this.getBorderedP(data.name)}
      `;
    }
    if (data.author_name && data.author_name.length > 0) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.pia_author'))}
      ${this.getBorderedP(data.author_name)}
      `;
    }
    if (data.evaluator_name && data.evaluator_name.length > 0) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.pia_assessor'))}
      ${this.getBorderedP(data.evaluator_name)}
      `;
    }
    if (data.validator_name && data.validator_name.length > 0) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.pia_validator'))}
      ${this.getBorderedP(data.validator_name)}
      `;
    }
    if (data.created_at) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.creation_date'))}
      ${this.getBorderedP(Moment(data.created_at).format(environment.date_format))}
      `;
    }
    if (data.dpos_names && data.dpos_names.length > 0) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.dpo_name'))}
      ${this.getBorderedP(data.dpos_names)}
      `;
    }
    if (data.dpo_status && data.dpo_status.length > 0) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.dpo_status'))}
      ${this.getBorderedP(this.translate.instant(this._piaService.getOpinionsStatus(data.dpo_status.toString())))}
      `;
    }
    if (data.dpo_opinion && data.dpo_opinion.length > 0) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.dpo_opinion'))}
      ${this.getBorderedP(data.dpo_opinion)}
      `;
    }

    // Searched opinion for concerned people
    if (data.concerned_people_searched_opinion === true) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.concerned_people_searched_opinion'))}
      ${this.getBorderedP(this.translate.instant(this._piaService.getPeopleSearchStatus(data.concerned_people_searched_opinion)))}
      `;
      if (data.people_names && data.people_names.length > 0) {
        piaInformations += `
        ${this.geth3Title(this.translate.instant('summary.concerned_people_name'))}
        ${this.getBorderedP(data.people_names)}
        `;
      }
      if (data.concerned_people_status >= 0) {
        piaInformations += `
        ${this.geth3Title(this.translate.instant('summary.concerned_people_status'))}
        ${this.getBorderedP(this.translate.instant(this._piaService.getOpinionsStatus(data.concerned_people_status.toString())))}
        `;
      }
      if (data.concerned_people_opinion && data.concerned_people_opinion.length > 0) {
        piaInformations += `
        ${this.geth3Title(this.translate.instant('summary.pia_author'))}
        ${this.getBorderedP(data.author_name)}
        `;
      }
    }

    // Unsearched opinion for concerned people
    if (data.concerned_people_searched_opinion === false) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.concerned_people_searched_opinion'))}
      ${this.getBorderedP(this.translate.instant(this._piaService.getPeopleSearchStatus(data.concerned_people_searched_opinion)))}
      `;
      if (data.concerned_people_searched_content && data.concerned_people_searched_content.length > 0) {
        piaInformations += `
        ${this.geth3Title(this.translate.instant('summary.concerned_people_unsearched_opinion_comment'))}
        ${this.getBorderedP(data.concerned_people_searched_content)}
        `;
      }
    }

    if (data.applied_adjustments && data.applied_adjustments.length > 0) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.modification_made'))}
      ${this.getBorderedP(data.applied_adjustments)}
      `;
    }
    if (data.rejected_reason && data.rejected_reason.length > 0) {
      piaInformations += `
      ${this.geth3Title(this.translate.instant('summary.rejection_reason'))}
      ${this.getBorderedP(data.rejected_reason)}
      `;
    }
    return piaInformations;
  }

  getProcessing(data: ProcessingCsvRow) {
    if (!data) {return''};
    
    return `
      ${this.geth1Title(this.translate.instant('summary.processing')+' "'+data.name+'"')}
      
      ${this.getP(data.updated_at)}

      ${this.geth2Title(this.translate.instant('processing.form.sections.description.title'))}

      ${this.geth3Title(this.translate.instant('processing.form.description.title'))}
      ${this.getP(data.description)}

      ${this.geth3Title(this.translate.instant('processing.form.context_of_implementation.title'))}
      ${this.getP(data.context_of_implementation)}

      ${this.geth3Title(this.translate.instant('processing.form.controllers.title'))}
      ${this.getP(data.controllers)}

      ${this.geth3Title(this.translate.instant('processing.form.lawfulness.title'))}
      ${this.getP(data.lawfulness)}

      ${this.geth3Title(this.translate.instant('processing.form.standards.title'))}
      ${this.getP(data.standards)}

      ${this.geth3Title(this.translate.instant('processing.form.consent.title'))}
      ${this.getP(data.consent)}

      ${this.geth3Title(this.translate.instant('processing.form.rights_guarantee.title'))}
      ${this.getP(data.rights_guarantee)}

      ${this.geth2Title(this.translate.instant('processing.form.sections.data.title'))}

      ${this.geth3Title(this.translate.instant('processing.form.data-types'))}
      ${this.getProcessingDataTypes(JSON.parse(data.processing_data_types))}

      ${this.geth3Title(this.translate.instant('processing.form.concerned_people.title'))}
      ${this.getP(data.concerned_people)}

      ${this.geth3Title(this.translate.instant('processing.form.exactness.title'))}
      ${this.getP(data.exactness)}

      ${this.geth3Title(this.translate.instant('processing.form.minimization.title'))}
      ${this.getP(data.minimization)}

      ${this.geth3Title(this.translate.instant('processing.form.storage.title'))}
      ${this.getP(data.storage)}

      ${this.geth2Title(this.translate.instant('processing.form.sections.lifecycle.title'))}

      ${this.geth3Title(this.translate.instant('processing.form.lifecycle.title'))}
      ${this.getP(data.life_cycle)}

      ${this.geth3Title(this.translate.instant('processing.form.processors.title'))}
      ${this.getP(data.processors)}

      ${this.geth3Title(this.translate.instant('processing.form.recipients.title'))}
      ${this.getP(data.recipients)}

      ${this.geth3Title(this.translate.instant('processing.form.non-eu-transfer.title'))}
      ${this.getP(data.non_eu_transfer)}
    `;
  }

  async getRisks(data) {
    if (!data) {return''};

    let risks = `${this.geth1Title(this.translate.instant('sections.3.title'))}`;
    await Promise.all(this._piaService.data.sections.map(async (section) => {

      // Taking risks section 3 only
      if (section.id === 3) {
        await Promise.all(section.items.map(async (item) => {
          const ref = section.id.toString() + '.' + item.id.toString();
          let currentRiskSection = ``;
          // Measure
          if (item.is_measure) {
              const entries: any = await this.measureApi.getAll(data.id).toPromise();
              currentRiskSection += `${this.geth2Title(this.translate.instant(item.title))} <br/>`;

              await Promise.all(entries.map(async (measure) => {
                /* Completed measures */
                if (measure.title !== undefined && measure.content !== undefined) {
                  let evaluation = null;
                  if (item.evaluation_mode === 'question') {
                    evaluation = await this.getEvaluation(section.id, item.id, ref + '.' + measure.id, data.id);
                  }

                  currentRiskSection += `${this.geth3Title(measure.title)}`
                  currentRiskSection += `${this.getP(measure.content)}`

                  if(evaluation) {
                    currentRiskSection += `${this.getBorderedEvaluation(this.translate.instant(evaluation.title), evaluation.evaluation_comment)}`
                  }
                }
              }));
          } else if (item.questions) { // Question
            currentRiskSection += `${this.geth2Title(this.translate.instant(item.title))} <br/>`;
            await Promise.all( item.questions.map(async (question) => {
              const answerModel = await this.answerApi.getByRef(data.id, question.id).toPromise();

              currentRiskSection += `${this.geth3Title(this.translate.instant(question.title))}`

              /* An answer exists */
              if (answerModel && answerModel.data) {
                const content = [];
                if (answerModel.data.gauge && answerModel.data.gauge > 0) {
                  content.push(this.translate.instant(this._piaService.getGaugeLabel(answerModel.data.gauge)));
                }
                if (answerModel.data.text && answerModel.data.text.length > 0) {
                  content.push(answerModel.data.text);
                }
                if (answerModel.data.list && answerModel.data.list.length > 0) {
                  content.push(answerModel.data.list.join(', '));
                }
                if (content.length > 0) {
                  currentRiskSection += `${this.getP(content.join(', '))}`
                  if (item.evaluation_mode === 'question') {
                    const evaluation: any = await this.getEvaluation(section.id, item.id, ref + '.' + question.id, data.id);

                    if(evaluation) {
                      currentRiskSection += `${this.getBorderedEvaluation(this.translate.instant(evaluation.title), evaluation.evaluation_comment)}`
                    }
                  }
                }
              }
            }));
          }
          if (item.evaluation_mode === 'item') {
            const evaluation: any = await this.getEvaluation(section.id, item.id, ref, data.id);

            if(evaluation) {
              currentRiskSection += `${this.getBorderedEvaluation(this.translate.instant(evaluation.title), evaluation.evaluation_comment)}`
            }
          }
          risks += currentRiskSection
        }));
      }
    }));

    return risks;
  }

  async exportLibreOffice() {
    if (this.selectedFolder.length === 0 && this.selectedProcessing.length === 0) {
      return;
    }

    this.exportIsLoading = true;
    this.folderToExport = [];
    this.processingToExport = [];
    this.piaToExportOdt = [];

    try {
      await this.getDataToExport(this.selectedFolder, this.selectedProcessing)
    } catch (e) {
      console.log(e)
    }

    //console.log('folderToExport', this.folderToExport)
    //console.log('processingToExport', this.processingToExport)

    let fileData = '';

    // dirty fix
    this.processingToExport.forEach((processing) => {
      fileData += `${this.getProcessing(processing)}`
    });

    await Promise.all(this.piaToExportOdt.map(async pia => {
      const risks = await this.getRisks(pia)
      fileData += `
      <br/>
      <br/>

      ${this.getPiaInformation(pia)}
      //${this.getProcessing(this.processingToExport.find(process => process.id === pia.processing.id))}

      ${risks}

        ${this.geth1Title('Action Plan')}
        ${this.geth2Title('Fundamental principles')}
        ${this.getBorderedP('No action plan recorded.')}
        ${this.geth2Title('Existing or planned measures')}
        ${this.getBorderedP('No action plan recorded.')}
        ${this.geth2Title('Risks')}
        ${this.getBorderedP('No action plan recorded.')}
      `;
      return Promise.resolve();
    }))

    const mime = 'application/vnd.oasis.opendocument.text';
    const blob = new Blob([`
      <head>
        <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
        <title>Action plan</title>
      </head>


      <body lang="en-GB" dir="ltr">
        ${fileData}
      </body>`], {type: mime});

    saveAs(blob, 'Processing & Pia')
    this.exportIsLoading = false;
  }

  async exportCsv() {
    if (this.selectedFolder.length === 0 && this.selectedProcessing.length === 0) {
      return;
    }

    this.exportIsLoading = true;
    this.folderToExport = [];
    this.processingToExport = [];

    try {
      await this.getDataToExport(this.selectedFolder, this.selectedProcessing)
    } catch (e) {
      console.log(e)
    }

    const options = {
      fieldSeparator: ';',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      useBom: true,
      headers: [
        'id',
        'name',
        'path',
        'parent_id',
        'person_in_charge',
        'structure_id'
      ]}

    new Angular5Csv(this.folderToExport, 'folders', options)

    const optionsProcess = {
      fieldSeparator: ';',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      useBom: true,
      headers: [
        'id',
        'name',
        'parent_id',
        'author',
        'consent',
        'context_of_implementation',
        'controllers',
        'description',
        'designated_controller',
        'exactness',
        'life_cycle',
        'minimization',
        'non_eu_transfer',
        'processors',
        'standards',
        'status',
        'storage',
        'processing_data_types',
        'recipients'
      ]}

    new Angular5Csv(this.processingToExport, 'processing', optionsProcess)

    const piaHeaders =  [
      'processing_id',
      'author_name',
      'concerned_people_opinion',
      'concerned_people_searched_content',
      'concerned_people_searched_opinion',
      'concerned_people_status',
      'dpo_opinion',
      'dpo_status',
      'dpos_names',
      'evaluator_name',
      'is_example',
      'number_of_questions',
      'people_names',
      'progress',
      'rejection_reason',
      'status',
      'type',
      'validator_name',
      'answers',
      'created_at'
    ];


    const optionsPia = {
      fieldSeparator: ';',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      useBom: true,
      headers: piaHeaders
    }

    new Angular5Csv(this.piaToExport, 'pia', optionsPia)

    this.exportIsLoading = false;
  }

  /**
   * Get an evaluation by reference.
   * @private
   * @param {string} section_id - The section id.
   * @param {string} item_id - The item id.
   * @param {string} ref - The reference.
   * @returns {Promise}
   * @memberof SummaryComponent
   */
  private async getEvaluation(section_id: string, item_id: string, ref: string, piaId: number) {
    return new Promise(async (resolve, reject) => {
      let evaluation = null;

      this.evaluationApi.getByRef(piaId, ref).subscribe((theEval: EvaluationModel) => {
        if (theEval) {
          evaluation = {
            'title': theEval.getStatusLabel(),
            'action_plan_comment': theEval.action_plan_comment,
            'evaluation_comment': theEval.evaluation_comment,
            'gauges': {
              'riskName': { value: this.translate.instant('sections.' + section_id + '.items.' + item_id + '.title') },
              'seriousness': theEval.gauges ? theEval.gauges.x : null,
              'likelihood': theEval.gauges ? theEval.gauges.y : null
            }
          };
        }
        resolve(evaluation);
      });
    });
  }

  async getDataToExport(folder, processing, parentFolder = null) {
    if (processing && Array.isArray(processing) && processing.length > 0) {
      await Promise.all(processing.map(async processId => {

        const data: any = await this.processingApi.export(processId).toPromise();
        // pia for csv
        await Promise.all(data.pias.map(pia => this.piaToExport.push(this.piaToCsv(pia, processId))));

        // pia for odt
        const pias = await this.piaApi.getAll({'processing' : processId}).toPromise();
        await Promise.all(pias.map(pia => this.piaToExportOdt.push(this.piaToOdt(pia))));
        this.processingToExport.push(this.processingToCsv(data, parentFolder, processId))
        return Promise.resolve();
      }));
    }
    if (folder && Array.isArray(folder) && folder.length > 0) {
      await Promise.all(folder.map( async folderId => {
        let folderData = null;
        try {
        folderData = await this.folderApi.get(this.structure.id, folderId).toPromise();
        } catch (e) {
          console.log(e)
          return Promise.reject(e);
        }
        this.folderToExport.push(this.folderToCsv(folderData))
        const folderIds = folderData.children.map(children => children.id)
        const ProcessingIds = folderData.processings.map(process => process.id)
        try {
          await this.getDataToExport(folderIds, ProcessingIds, folderData.id)
        } catch (e) {
          console.log(e)
          return Promise.reject(e);
        }
        return Promise.resolve();
      }));
    }
  }

  folderToCsv(folder): FolderCsvRow {
    return {
      id: folder.id,
      name: folder.name,
      path: folder.path,
      parent_id: folder.parent.isRoot ? null : folder.parent.id,
      person_in_charge: folder.person_in_charge,
      structure_id: folder.structure_id,
    }
  }

  processingToCsv(processing, parentId, id): ProcessingCsvRow {
    return {
      id: id,
      name: processing.name,
      parent_id: parentId,
      author: processing.author,
      created_at: processing.created_at,
      updated_at: processing.updated_at,
      concerned_people: processing.concerned_people,
      consent: processing.consent,
      context_of_implementation: processing.context_of_implementation,
      controllers: processing.controllers,
      description: processing.description,
      designated_controller: processing.designated_controller,
      exactness: processing.exactness,
      lawfulness: processing.lawfulness,
      life_cycle: processing.life_cycle,
      minimization: processing.minimization,
      non_eu_transfer: processing.non_eu_transfer,
      processing_data_types: JSON.stringify(processing.processing_data_types),
      processors: processing.processors,
      recipients: processing.recipients,
      rights_guarantee: processing.rights_guarantee,
      standards: processing.standards,
      status: processing.status,
      storage: processing.storage
    }
  }

  piaToCsv(pia, processingId): PiaCsvRow {
    const answers = pia.answers.map(answer => {
      const sectionNumber = answer.reference_to.toString().substring(0, 1);
      const itemNumber = answer.reference_to.toString().substring(1, 2);
      const questionNumber = answer.reference_to.toString().substring(2, 3);
      return {
        question: this.translate.instant(`sections.${sectionNumber}.items.${itemNumber}.questions.${questionNumber}`),
        answer: answer.data
      }
    });

    return {
      id: pia.id,
      processing_id: processingId,
      author_name: pia.author_name,
      concerned_people_opinion: pia.concerned_people_opinion,
      concerned_people_searched_content: pia.concerned_people_searched_content,
      concerned_people_searched_opinion: pia.concerned_people_searched_opinion,
      concerned_people_status: pia.concerned_people_status,
      dpo_opinion: pia.dpo_opinion,
      dpo_status: pia.dpo_status,
      dpos_names: pia.dpos_names,
      evaluator_name: pia.evaluator_name,
      is_example: pia.is_example,
      number_of_questions: pia.number_of_questions,
      people_names: pia.people_names,
      progress: pia.progress,
      rejection_reason: pia.rejection_reason,
      status: pia.status,
      type: pia.type,
      validator_name: pia.validator_name,
      answers: JSON.stringify(answers),
      created_at: pia.created_at,
      updated_at: pia.updated_at
    }
  }

  piaToOdt(pia): any {

    return {
      id: pia.id,
      processing: pia.processing,
      author_name: pia.author_name,
      concerned_people_opinion: pia.concerned_people_opinion,
      concerned_people_searched_content: pia.concerned_people_searched_content,
      concerned_people_searched_opinion: pia.concerned_people_searched_opinion,
      concerned_people_status: pia.concerned_people_status,
      dpo_opinion: pia.dpo_opinion,
      dpo_status: pia.dpo_status,
      dpos_names: pia.dpos_names,
      evaluator_name: pia.evaluator_name,
      is_example: pia.is_example,
      number_of_questions: pia.number_of_questions,
      people_names: pia.people_names,
      progress: pia.progress,
      rejection_reason: pia.rejection_reason,
      status: pia.status,
      type: pia.type,
      validator_name: pia.validator_name,
      created_at: pia.created_at,
      updated_at: pia.updated_at
    }
  }
}
