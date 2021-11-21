class BaseSerializer {
  constructor(status, data, paginationInfo = null) {
    this.status = status;
    this.data = data;
    this.paginationInfo = paginationInfo;
  }

  toJSON() {
    return {
      status: this.status,
      data: this.data,
      paginationInfo: this.paginationInfo,
    };
  }
}

module.exports = BaseSerializer;
