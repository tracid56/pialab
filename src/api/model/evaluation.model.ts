
import { BaseModel } from '@api/model/base.model'
import * as moment from 'moment';

export class Evaluation extends BaseModel {

  public id: any;
  public pia_id: any;
  public reference_to: string;
  public status = 0; // 0: pending, 1: toBeFixed, 2: improvable, 3: acceptable
  public action_plan_comment: string;
  public evaluation_comment: string;
  public evaluation_date: Date;
  public gauges: { x: number, y: number } = { x: 0, y: 0 };
  public estimated_implementation_date: Date;
  public person_in_charge: string;
  public global_status = 0; // 0: No evaluation, 1: Evaluation started, 2: Evaluation completed


  public getStatusLabel(): string {
      return this.status >= 0 ? `evaluations.status.${this.status}` : '';
  }

  public mapFromJson(json: any): any {
    return Object.assign({},super.mapFromJson(json),{
      evaluation_date : json.evaluation_date ? moment(json.evaluation_date).toDate():null,
      estimated_implementation_date : json.estimated_implementation_date?moment(json.estimated_implementation_date).toDate():null
    });
  }

  public mapToJson(): any {
    return Object.assign({},super.mapToJson(),{
      evaluation_date : this.evaluation_date ? moment(this.evaluation_date).format() : moment().format(),
      estimated_implementation_date : this.estimated_implementation_date ? moment(this.estimated_implementation_date).format() : moment().format(),
    });
  }

}
