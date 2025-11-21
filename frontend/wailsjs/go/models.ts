export namespace backend {
	
	export class HistoryEntry {
	    temp: number;
	    datetime: string;
	
	    static createFrom(source: any = {}) {
	        return new HistoryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.temp = source["temp"];
	        this.datetime = source["datetime"];
	    }
	}

}

