import React from 'react';

export default class PercentSelect extends React.Component {
  render() {
    let options = [];
    for (var i = 10; i <= 100; i+=10) {
      options.push(<option key={i*100} value={i*100}>{i}%</option>);
    }
    return(
      <select {...this.props}>
        {options}
      </select>
    );
  }
}