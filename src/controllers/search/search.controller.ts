// SELECT * FROM `streets` WHERE `street_name` LIKE '
import * as express from 'express';
import { Request, Response } from 'express';
import IControllerBase from 'interfaces/IControllerBase.interface';
import database, { DBResponse } from '../../database';

class SearchController implements IControllerBase {
	public path = '/search';
	public router = express.Router();

	constructor() {
		this.initRoutes();
	}

	public initRoutes() {
		this.router.get(this.path, this.search);
	}

	search = async (req: Request, res: Response) => {
		if (req.query.street) {
			database.searchByStreetName(req.query.street, (response: DBResponse) => {
				res.status(response.success ? 200 : 400).send(response);
			});
			return;
		}
		res.status(400).send({ success: false, error: 'Street name can\'t be null' });
	};

}

export default SearchController;
