import styled from 'styled-components';
import Flex from './../Flex';

const Container = styled(Flex).attrs(props => ({
    auto: 1
}))`
    max-width: 1200px;
    margin: 0 auto;

    @media (max-width: 1200px) {
        margin: 0 20px;
    }
`;

export default Container;
